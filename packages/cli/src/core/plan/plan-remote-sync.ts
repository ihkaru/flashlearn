import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { CurriculumPlanDocument, PlanModuleEntry, PlanUnitEntry } from '@flashlearn/shared';
import type { ApiClient } from '../client';
import { importInteractiveModule } from '../interactive-importer';
import {
  loadCurriculumPlan,
  saveCurriculumPlan,
  type GlossaryMasterDocument,
} from './plan-builder';
import { slugifyText } from '../corpus/xml-utils';

export { pullRemoteToPlan } from './plan-remote-pull';

export interface PlanDiffEntry {
  slug: string;
  status: 'new' | 'modified' | 'in_sync' | 'not_authored' | 'remote_only';
  localState?: string;
  remoteContentId?: string;
  remoteTitle?: string;
}

function computeLocalModuleHash(absDir: string, mod: PlanModuleEntry): string | null {
  const mPath = mod.manifestPath ? join(absDir, mod.manifestPath) : '';
  if (!mPath || !existsSync(mPath)) return null;
  const h = createHash('sha256').update(readFileSync(mPath));
  if (mod.deckPath) {
    const dPath = join(absDir, mod.deckPath);
    if (existsSync(dPath)) h.update(readFileSync(dPath));
  }
  if (mod.simPath) {
    const sPath = join(absDir, mod.simPath);
    if (existsSync(sPath)) h.update(readFileSync(sPath));
  }
  return h.digest('hex');
}

function mergeModuleGlossaryIntoMaster(absDir: string, mod: PlanModuleEntry): void {
  const mPath = mod.manifestPath ? join(absDir, mod.manifestPath) : '';
  if (!mPath || !existsSync(mPath)) return;
  try {
    const parsed = JSON.parse(readFileSync(mPath, 'utf-8'));
    const terms: any[] = Array.isArray(parsed.glossary) ? parsed.glossary : [];
    if (terms.length === 0) return;

    const gPath = join(absDir, 'glossary-master.json');
    const rawMaster = existsSync(gPath) ? JSON.parse(readFileSync(gPath, 'utf-8')) : null;
    const master: GlossaryMasterDocument = Array.isArray(rawMaster)
      ? {
          schemaVersion: 'glossary-master-v1',
          updatedAt: new Date().toISOString(),
          terms: rawMaster.filter((t) => t && typeof t.term === 'string'),
        }
      : rawMaster && Array.isArray(rawMaster.terms)
      ? rawMaster
      : { schemaVersion: 'glossary-master-v1', updatedAt: new Date().toISOString(), terms: [] };

    const existing = new Set(master.terms.map((t) => t.term.toLowerCase()));
    for (const item of terms) {
      if (item?.term && !existing.has(String(item.term).toLowerCase())) {
        master.terms.push({
          term: String(item.term),
          definition: String(item.definition || ''),
          tier: item.tier === 2 ? 2 : 3,
          introducedInModule: mod.slug,
          highSchoolAnchor: item.highSchoolAnchor,
        });
        existing.add(String(item.term).toLowerCase());
      }
    }
    master.updatedAt = new Date().toISOString();
    writeFileSync(gPath, JSON.stringify(master, null, 2) + '\n', 'utf-8');
  } catch (err: any) {
    console.debug('[plan] glossary merge skipped:', err?.message || err);
  }
}

async function resolveRemoteWorkspaceId(
  client: ApiClient,
  plan: CurriculumPlanDocument,
  createIfMissing: boolean
): Promise<string | null> {
  if (plan.workspaceId) return plan.workspaceId;
  const workspaces = await client.request<any[]>('/api/v1/workspaces', { query: { scope: 'all' } }).catch(async () =>
    client.request<any[]>('/api/v1/workspaces')
  );
  const found = Array.isArray(workspaces)
    ? workspaces.find((w) => w.slug === plan.workspaceSlug)
    : undefined;
  if (found?.id) {
    plan.workspaceId = found.id;
    return found.id;
  }
  if (!createIfMissing) return null;
  const created = await client.request<any>('/api/v1/workspaces', {
    method: 'POST',
    body: {
      name: plan.workspaceName,
      slug: plan.workspaceSlug,
      description: `Kurikulum terstruktur (${plan.units.length} unit kuliah, ${plan.modules.length} modul).`,
      isPublic: true,
    },
  });
  plan.workspaceId = created.id;
  return created.id;
}

async function ensureRemoteUnitDomain(
  client: ApiClient,
  workspaceId: string,
  unit: PlanUnitEntry
): Promise<string | undefined> {
  if (unit.remoteDomainId) return unit.remoteDomainId;
  const listRes = await client
    .request<{ domains?: any[] }>(`/api/v1/domains/workspace/${workspaceId}`)
    .catch((err) => {
      console.debug('[plan] list domains skipped:', err?.message || err);
      return { domains: [] };
    });
  const existing = (listRes.domains || []).find((d) => d.code === unit.unitCode);
  if (existing?.id) {
    unit.remoteDomainId = existing.id;
    return existing.id;
  }
  const created = await client.request<any>('/api/v1/domains', {
    method: 'POST',
    body: {
      workspaceId,
      code: unit.unitCode,
      name: unit.unitTitle,
      slug: slugifyText(`${unit.unitCode}-${unit.unitTitle}`).slice(0, 60),
      description: unit.summary,
      targetRole: 'Pembelajar Mandiri',
      responsibilityScope: `Penguasaan materi ${unit.unitTitle} (±${unit.estimatedLectureMinutes} menit).`,
      legalAuthorityLevel: 1,
      minPassingScore: 80,
      status: 'active',
    },
  });
  unit.remoteDomainId = created.id;
  return created.id;
}

export async function diffPlanWithRemote(client: ApiClient, workDir: string) {
  const absDir = resolve(workDir);
  const plan = loadCurriculumPlan(absDir);
  const wsId = await resolveRemoteWorkspaceId(client, plan, false);
  const remoteContents: any[] = wsId
    ? await client.request<any[]>(`/api/v1/contents/workspace/${wsId}`).catch(() => [])
    : [];
  const remoteBySlug = new Map(remoteContents.map((c) => [c.slug, c]));
  const localSlugs = new Set(plan.modules.map((m) => m.slug));

  const entries: PlanDiffEntry[] = plan.modules.map((mod) => {
    const remote = remoteBySlug.get(mod.slug);
    const localHash = computeLocalModuleHash(absDir, mod);
    if (!localHash) {
      return {
        slug: mod.slug,
        status: 'not_authored',
        localState: mod.state,
        remoteContentId: remote?.id,
      };
    }
    if (!remote) {
      return { slug: mod.slug, status: 'new', localState: mod.state };
    }
    const changed = mod.contentSha256 !== localHash;
    return {
      slug: mod.slug,
      status: changed ? 'modified' : 'in_sync',
      localState: mod.state,
      remoteContentId: remote.id,
      remoteTitle: remote.title,
    };
  });

  for (const rc of remoteContents) {
    if (!localSlugs.has(rc.slug)) {
      entries.push({
        slug: rc.slug,
        status: 'remote_only',
        remoteContentId: rc.id,
        remoteTitle: rc.title,
      });
    }
  }

  return {
    workspaceId: wsId,
    workspaceSlug: plan.workspaceSlug,
    summary: {
      new: entries.filter((e) => e.status === 'new').length,
      modified: entries.filter((e) => e.status === 'modified').length,
      inSync: entries.filter((e) => e.status === 'in_sync').length,
      notAuthored: entries.filter((e) => e.status === 'not_authored').length,
      remoteOnly: entries.filter((e) => e.status === 'remote_only').length,
    },
    entries,
  };
}

export async function pushPlanToRemote(
  client: ApiClient,
  workDir: string,
  options: {
    moduleSlug?: string;
    unitCode?: string;
    dryRun?: boolean;
    uploadMedia?: boolean;
    vaultUrl?: string;
    vaultKey?: string;
  } = {}
) {
  const absDir = resolve(workDir);
  const plan = loadCurriculumPlan(absDir);

  const targets = plan.modules.filter((m) => {
    if (options.moduleSlug && m.slug !== options.moduleSlug) return false;
    if (options.unitCode && m.unitCode !== options.unitCode) return false;
    const mPath = m.manifestPath ? join(absDir, m.manifestPath) : '';
    return Boolean(mPath && existsSync(mPath));
  });

  if (targets.length === 0) {
    return {
      dryRun: Boolean(options.dryRun),
      pushedCount: 0,
      message: 'No authored local manifest files matched the push filter.',
      results: [],
    };
  }

  const wsId = options.dryRun
    ? plan.workspaceId || 'dry-run-workspace-id'
    : (await resolveRemoteWorkspaceId(client, plan, true))!;

  const results: any[] = [];
  for (const mod of targets) {
    const unit = plan.units.find((u) => u.unitCode === mod.unitCode);
    const domainId =
      !options.dryRun && unit ? await ensureRemoteUnitDomain(client, wsId, unit) : unit?.remoteDomainId;

    const manifestAbs = join(absDir, mod.manifestPath!);
    const deckAbs = mod.deckPath && existsSync(join(absDir, mod.deckPath)) ? join(absDir, mod.deckPath) : undefined;
    const simAbs = mod.simPath && existsSync(join(absDir, mod.simPath)) ? join(absDir, mod.simPath) : undefined;

    const res = await importInteractiveModule(client, {
      workspaceId: wsId,
      domainId,
      title: mod.title,
      slug: mod.slug,
      readingTimeMinutes: mod.estimatedMinutes,
      manifestPath: manifestAbs,
      deckPath: deckAbs,
      simPath: simAbs,
      dryRun: Boolean(options.dryRun),
      mediaOpts: {
        enabled: Boolean(options.uploadMedia),
        dryRun: Boolean(options.dryRun),
        vaultUrl: options.vaultUrl,
        apiKey: options.vaultKey,
      },
    });

    if (!options.dryRun) {
      mod.state = 'published';
      mod.remoteContentId = (res as any).contentId || mod.remoteContentId;
      mod.contentSha256 = computeLocalModuleHash(absDir, mod) || undefined;
      mod.lastUpdatedAt = new Date().toISOString();
      mergeModuleGlossaryIntoMaster(absDir, mod);
    }

    results.push({ slug: mod.slug, unitCode: mod.unitCode, ...res });
  }

  if (!options.dryRun) {
    saveCurriculumPlan(absDir, plan);
  }

  return {
    dryRun: Boolean(options.dryRun),
    workspaceId: wsId,
    pushedCount: results.length,
    results,
  };
}

export async function pruneRemoteFromPlan(
  client: ApiClient,
  workDir: string,
  options: { dryRun?: boolean } = {}
) {
  const diff = await diffPlanWithRemote(client, workDir);
  const orphans = diff.entries.filter((e) => e.status === 'remote_only' && e.remoteContentId);
  if (options.dryRun || orphans.length === 0) {
    return {
      dryRun: Boolean(options.dryRun),
      pruneCandidates: orphans,
      deletedCount: 0,
    };
  }

  const deleted: any[] = [];
  for (const item of orphans) {
    await client.request(`/api/v1/contents/${item.remoteContentId}`, { method: 'DELETE' });
    deleted.push({ slug: item.slug, contentId: item.remoteContentId });
  }
  return { dryRun: false, deletedCount: deleted.length, deleted };
}
