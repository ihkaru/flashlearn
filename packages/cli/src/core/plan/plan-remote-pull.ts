import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import type { CurriculumPlanDocument, PlanModuleEntry, PlanUnitEntry } from '@flashlearn/shared';
import type { ApiClient } from '../client';
import { slugifyText } from '../corpus/xml-utils';
import { saveCurriculumPlan } from './plan-builder';

/**
 * Pulls live workspace, lecture units (domains), and module manifests from a
 * remote FlashLearn server into a local resumable workDir on any PC.
 */
export async function pullRemoteToPlan(
  client: ApiClient,
  workspaceIdOrSlug: string,
  workDir: string
) {
  const absDir = resolve(workDir);
  mkdirSync(join(absDir, 'modules'), { recursive: true });
  mkdirSync(join(absDir, 'decks'), { recursive: true });

  const ws = await client.request<any>(`/api/v1/workspaces/${workspaceIdOrSlug}`);
  const [contents, domainsRes] = await Promise.all([
    client.request<any[]>(`/api/v1/contents/workspace/${ws.id}`),
    client
      .request<{ domains?: any[] }>(`/api/v1/domains/workspace/${ws.id}`)
      .catch((err) => {
        console.debug('[plan/pull] list domains skipped:', err?.message || err);
        return { domains: [] };
      }),
  ]);

  const domains = domainsRes.domains || [];
  const domainById = new Map(domains.map((d) => [d.id, d]));

  const unitsMap = new Map<string, PlanUnitEntry>();
  const modules: PlanModuleEntry[] = [];

  for (let idx = 0; idx < contents.length; idx++) {
    const c = contents[idx];
    const dom = c.domainId ? domainById.get(c.domainId) : undefined;
    const unitCode = dom?.code || 'U01';
    const unitTitle = dom?.name || 'Unit 1: Materi Utama';

    if (!unitsMap.has(unitCode)) {
      unitsMap.set(unitCode, {
        unitCode,
        unitTitle,
        unitOrder: unitsMap.size + 1,
        summary: dom?.description || `Unit ditarik dari produksi (${ws.name}).`,
        estimatedLectureMinutes: 0,
        remoteDomainId: dom?.id,
        moduleSlugs: [],
      });
    }

    const safeSlug = slugifyText(String(c.slug || c.title || `module-${idx + 1}`), `module-${idx + 1}`);
    const u = unitsMap.get(unitCode)!;
    const mins = c.readingTimeMinutes || c.interactivePayload?.estimatedMinutes || 5;
    u.estimatedLectureMinutes += mins;
    u.moduleSlugs.push(safeSlug);

    const manifestRel = `modules/${safeSlug}.uila-v2.json`;
    const modulesRoot = resolve(absDir, 'modules') + sep;
    const targetManifestPath = resolve(absDir, manifestRel);
    if (!targetManifestPath.startsWith(modulesRoot)) {
      throw new Error(`Unsafe remote content slug rejected: "${c.slug}"`);
    }
    let contentHash: string | undefined;
    if (c.interactivePayload) {
      const jsonStr = JSON.stringify(c.interactivePayload, null, 2) + '\n';
      writeFileSync(targetManifestPath, jsonStr, 'utf-8');
      contentHash = createHash('sha256').update(jsonStr).digest('hex');
    }

    modules.push({
      slug: safeSlug,
      title: c.title,
      unitCode,
      moduleOrder: idx + 1,
      knowledgeProfile: c.interactivePayload?.knowledgeProfile || 'bridging_understand',
      estimatedMinutes: mins,
      needsSlideDeck: Boolean(c.hasSlideDeck),
      sourceSliceIds: c.interactivePayload?.unitMeta?.sourceSliceIds || [],
      prerequisites: idx > 0 ? [slugifyText(String(contents[idx - 1].slug || `module-${idx}`), `module-${idx}`)] : [],
      state: 'published',
      manifestPath: c.interactivePayload ? manifestRel : undefined,
      deckPath: c.hasSlideDeck ? `decks/${safeSlug}.html` : undefined,
      remoteContentId: c.id,
      contentSha256: contentHash,
      lastUpdatedAt: c.updatedAt,
    });
  }

  const now = new Date().toISOString();
  const plan: CurriculumPlanDocument = {
    schemaVersion: 'curriculum-plan-v1',
    projectSlug: ws.slug,
    workspaceName: ws.name,
    workspaceSlug: ws.slug,
    workspaceId: ws.id,
    scaleClass: modules.length <= 4 ? 'S' : modules.length <= 15 ? 'M' : 'L',
    maxUnitMinutes: 120,
    corpusIndexPath: 'corpus-index.json',
    createdAt: now,
    updatedAt: now,
    coverage: { totalSlices: modules.length, mappedSlices: modules.length, unmappedSliceIds: [] },
    units: Array.from(unitsMap.values()),
    modules,
  };

  const planPath = saveCurriculumPlan(absDir, plan);
  return {
    planPath,
    workspaceId: ws.id,
    workspaceName: ws.name,
    unitsPulled: plan.units.length,
    modulesPulled: plan.modules.length,
  };
}
