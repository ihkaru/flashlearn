import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type {
  CorpusIndexDocument,
  CorpusSliceEntry,
  CurriculumPlanDocument,
  KnowledgeProfile,
  PlanModuleEntry,
  PlanModuleState,
  PlanUnitEntry,
} from '@flashlearn/shared';
import { slugifyText } from '../corpus/xml-utils';

export type DeckPolicy = 'selective' | 'all' | 'none';

export interface GlossaryMasterEntry {
  term: string;
  definition: string;
  tier: 2 | 3;
  introducedInModule: string;
  highSchoolAnchor?: string;
}

export interface GlossaryMasterDocument {
  schemaVersion: 'glossary-master-v1';
  updatedAt: string;
  terms: GlossaryMasterEntry[];
}

export interface DagLedgerDocument {
  schemaVersion: 'dag-ledger-v1';
  updatedAt: string;
  nodes: Array<{ slug: string; unitCode: string; prerequisites: string[] }>;
}

function inferKnowledgeProfile(slice: CorpusSliceEntry): KnowledgeProfile {
  const h = slice.heading.toLowerCase();
  if (/(kasus|dilema|etika|kebijakan|strategi|sejarah|hukum|perspektif|tata kelola|audit)/.test(h)) {
    return 'ill_structured_case';
  }
  if (/(langkah|prosedur|implementasi|tutorial|praktik|algoritma|kalkulasi|rumus|instalasi|debug)/.test(h)) {
    return 'procedural_do';
  }
  if (slice.estimatedStudyMinutes <= 5 && slice.estimatedTokens <= 900) {
    return 'micro_know';
  }
  return 'bridging_understand';
}

function shouldHaveDeck(
  profile: KnowledgeProfile,
  isFirstInUnit: boolean,
  policy: DeckPolicy
): boolean {
  if (policy === 'all') return true;
  if (policy === 'none') return false;
  return profile === 'bridging_understand' || isFirstInUnit;
}

/**
 * Lossless University-Lecture Curriculum Planner:
 * - Maps 100% of CorpusSlices into modules (ZERO details omitted).
 * - Packs modules into Lecture Units strictly <= maxUnitMinutes (default 120 min = 2 hours).
 * - Preserves sequential prerequisites across units/modules for incremental Coding Agent handoff.
 */
export function buildResumableCurriculumPlan(options: {
  workDir: string;
  corpusIndex: CorpusIndexDocument;
  workspaceName: string;
  workspaceSlug?: string;
  maxUnitMinutes?: number;
  targetModuleMinutes?: number;
  deckPolicy?: DeckPolicy;
}): {
  planPath: string;
  handoffPath: string;
  plan: CurriculumPlanDocument;
} {
  const absDir = resolve(options.workDir);
  mkdirSync(join(absDir, 'modules'), { recursive: true });
  mkdirSync(join(absDir, 'decks'), { recursive: true });

  const maxUnitMinutes = Math.min(120, Math.max(20, options.maxUnitMinutes ?? 90));
  const targetModuleMinutes = Math.min(20, Math.max(4, options.targetModuleMinutes ?? 10));
  const deckPolicy = options.deckPolicy ?? 'selective';
  const workspaceSlug = options.workspaceSlug || slugifyText(options.workspaceName, 'kurikulum');

  // 1. Group slices losslessly into bite-sized modules (~5-15 min each, never dropping a slice)
  const rawModuleGroups: Array<{ slices: CorpusSliceEntry[]; minutes: number }> = [];
  let curSlices: CorpusSliceEntry[] = [];
  let curMin = 0;

  for (const sl of options.corpusIndex.slices) {
    const slMin = Math.max(3, sl.estimatedStudyMinutes);
    if (curSlices.length > 0 && curMin + slMin > targetModuleMinutes) {
      rawModuleGroups.push({ slices: curSlices, minutes: curMin });
      curSlices = [sl];
      curMin = slMin;
    } else {
      curSlices.push(sl);
      curMin += slMin;
    }
  }
  if (curSlices.length > 0) {
    rawModuleGroups.push({ slices: curSlices, minutes: curMin });
  }

  // 2. Pack modules into Lecture Units (each strictly <= maxUnitMinutes <= 120 min)
  const units: PlanUnitEntry[] = [];
  const modules: PlanModuleEntry[] = [];
  const usedSlugs = new Set<string>();

  let unitIdx = 1;
  let unitMin = 0;
  let unitModSlugs: string[] = [];
  let unitFirstTitle = '';
  let prevModuleSlug: string | null = null;
  let globalModOrder = 0;

  const flushUnit = () => {
    if (unitModSlugs.length === 0) return;
    const unitCode = `U${String(unitIdx).padStart(2, '0')}`;
    units.push({
      unitCode,
      unitTitle: `Pertemuan ${unitIdx}: ${unitFirstTitle.slice(0, 72)}`,
      unitOrder: unitIdx,
      summary: `Unit kuliah terstruktur (${unitModSlugs.length} sesi, ±${unitMin} menit, lossless dari sumber asli).`,
      estimatedLectureMinutes: unitMin,
      moduleSlugs: [...unitModSlugs],
    });
    unitIdx++;
    unitMin = 0;
    unitModSlugs = [];
    unitFirstTitle = '';
  };

  for (const grp of rawModuleGroups) {
    const modMinutes = Math.max(3, Math.min(30, grp.minutes));
    if (unitModSlugs.length > 0 && unitMin + modMinutes > maxUnitMinutes) {
      flushUnit();
    }

    globalModOrder++;
    const currentUnitCode = `U${String(unitIdx).padStart(2, '0')}`;
    const leadSlice = grp.slices[0];
    const isFirstInUnit = unitModSlugs.length === 0;
    if (isFirstInUnit) {
      unitFirstTitle = leadSlice.heading;
    }

    const baseSlug = `${currentUnitCode.toLowerCase()}-${String(globalModOrder).padStart(2, '0')}-${slugifyText(leadSlice.heading).slice(0, 36)}`;
    let slug = baseSlug;
    let dup = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${dup++}`;
    }
    usedSlugs.add(slug);

    const profile = inferKnowledgeProfile(leadSlice);
    const needsSlideDeck = shouldHaveDeck(profile, isFirstInUnit, deckPolicy);

    modules.push({
      slug,
      title: leadSlice.heading,
      unitCode: currentUnitCode,
      moduleOrder: globalModOrder,
      knowledgeProfile: profile,
      estimatedMinutes: modMinutes,
      needsSlideDeck,
      sourceSliceIds: grp.slices.map((s) => s.sliceId),
      prerequisites: prevModuleSlug ? [prevModuleSlug] : [],
      state: 'planned',
      manifestPath: `modules/${slug}.uila-v2.json`,
      deckPath: needsSlideDeck ? `decks/${slug}.html` : undefined,
    });

    unitModSlugs.push(slug);
    unitMin += modMinutes;
    prevModuleSlug = slug;
  }
  flushUnit();

  const mappedSet = new Set(modules.flatMap((m) => m.sourceSliceIds));
  const unmappedSliceIds = options.corpusIndex.slices
    .map((s) => s.sliceId)
    .filter((id) => !mappedSet.has(id));

  const now = new Date().toISOString();
  const plan: CurriculumPlanDocument = {
    schemaVersion: 'curriculum-plan-v1',
    projectSlug: workspaceSlug,
    workspaceName: options.workspaceName,
    workspaceSlug,
    scaleClass: options.corpusIndex.recommendedScale,
    maxUnitMinutes,
    corpusIndexPath: 'corpus-index.json',
    createdAt: now,
    updatedAt: now,
    coverage: {
      totalSlices: options.corpusIndex.slices.length,
      mappedSlices: mappedSet.size,
      unmappedSliceIds,
    },
    units,
    modules,
  };

  const planPath = saveCurriculumPlan(absDir, plan);
  const glossaryPath = join(absDir, 'glossary-master.json');
  if (!existsSync(glossaryPath)) {
    const emptyGlossary: GlossaryMasterDocument = {
      schemaVersion: 'glossary-master-v1',
      updatedAt: now,
      terms: [],
    };
    writeFileSync(glossaryPath, JSON.stringify(emptyGlossary, null, 2) + '\n', 'utf-8');
  }

  writeDagLedger(absDir, plan);
  const handoffPath = writeHandoffMarkdown(absDir, plan);
  return { planPath, handoffPath, plan };
}

export function loadCurriculumPlan(workDir: string): CurriculumPlanDocument {
  const planPath = join(resolve(workDir), 'curriculum-plan.json');
  if (!existsSync(planPath)) {
    throw new Error(`curriculum-plan.json not found in ${resolve(workDir)}. Run \`flashlearn plan init\` first.`);
  }
  return JSON.parse(readFileSync(planPath, 'utf-8')) as CurriculumPlanDocument;
}

export function saveCurriculumPlan(workDir: string, plan: CurriculumPlanDocument): string {
  const absDir = resolve(workDir);
  mkdirSync(absDir, { recursive: true });
  plan.updatedAt = new Date().toISOString();
  const planPath = join(absDir, 'curriculum-plan.json');
  writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n', 'utf-8');
  writeDagLedger(absDir, plan);
  writeHandoffMarkdown(absDir, plan);
  return planPath;
}

export function writeDagLedger(workDir: string, plan: CurriculumPlanDocument): void {
  const ledger: DagLedgerDocument = {
    schemaVersion: 'dag-ledger-v1',
    updatedAt: plan.updatedAt,
    nodes: plan.modules.map((m) => ({
      slug: m.slug,
      unitCode: m.unitCode,
      prerequisites: m.prerequisites,
    })),
  };
  writeFileSync(join(resolve(workDir), 'dag-ledger.json'), JSON.stringify(ledger, null, 2) + '\n', 'utf-8');
}

export function writeHandoffMarkdown(workDir: string, plan: CurriculumPlanDocument): string {
  const counts: Record<PlanModuleState, number> = {
    planned: 0,
    sliced: 0,
    designed: 0,
    uila_ready: 0,
    deck_ready: 0,
    audited: 0,
    published: 0,
  };
  for (const m of plan.modules) counts[m.state]++;
  const nextPending = plan.modules.find((m) => m.state !== 'published');

  const lines = [
    `# Agent Handoff: ${plan.workspaceName}`,
    '',
    `- **Scale**: \`${plan.scaleClass}\` | **Max Unit Lecture**: \`${plan.maxUnitMinutes} min\` | **Updated**: \`${plan.updatedAt}\``,
    `- **Lossless Coverage**: \`${plan.coverage.mappedSlices}/${plan.coverage.totalSlices}\` slices mapped (unmapped: \`${plan.coverage.unmappedSliceIds.length}\`)`,
    `- **Progress**: \`${counts.published}/${plan.modules.length}\` published | \`${counts.audited}\` audited | \`${counts.uila_ready + counts.deck_ready}\` authored | \`${counts.planned + counts.sliced + counts.designed}\` pending`,
    '',
    '## Resume Command for Next Coding Agent',
    '```bash',
    `flashlearn plan next --dir "${resolve(workDir)}" --count 2`,
    '```',
    '',
    nextPending
      ? `**Next Recommended Module**: \`${nextPending.slug}\` (${nextPending.unitCode}, profile \`${nextPending.knowledgeProfile}\`, state \`${nextPending.state}\`)`
      : '**All planned modules are published!** Run `flashlearn plan diff` to verify sync with production.',
    '',
    '## Unit Lecture Breakdown',
    ...plan.units.map((u) => {
      const done = plan.modules.filter((m) => m.unitCode === u.unitCode && m.state === 'published').length;
      return `- **${u.unitCode} — ${u.unitTitle}** (${done}/${u.moduleSlugs.length} published, ~${u.estimatedLectureMinutes} min)`;
    }),
    '',
  ];

  const handoffPath = join(resolve(workDir), 'HANDOFF.md');
  writeFileSync(handoffPath, lines.join('\n'), 'utf-8');
  return handoffPath;
}

export function buildAgentNextPacket(
  workDir: string,
  options: { count?: number; unitCode?: string } = {}
) {
  const absDir = resolve(workDir);
  const plan = loadCurriculumPlan(absDir);
  const count = Math.max(1, Math.min(5, options.count ?? 2));
  const corpusPath = join(absDir, plan.corpusIndexPath);
  const corpus: CorpusIndexDocument | null = existsSync(corpusPath)
    ? JSON.parse(readFileSync(corpusPath, 'utf-8'))
    : null;
  const sliceMap = new Map<string, CorpusSliceEntry>();
  for (const s of corpus?.slices || []) sliceMap.set(s.sliceId, s);

  const glossaryPath = join(absDir, 'glossary-master.json');
  const glossary: GlossaryMasterDocument = existsSync(glossaryPath)
    ? JSON.parse(readFileSync(glossaryPath, 'utf-8'))
    : { schemaVersion: 'glossary-master-v1', updatedAt: plan.updatedAt, terms: [] };

  const candidates = plan.modules
    .filter((m) => m.state !== 'published' && (!options.unitCode || m.unitCode === options.unitCode))
    .slice(0, count);

  const packets = candidates.map((mod) => {
    const slices = mod.sourceSliceIds.map((id) => {
      const meta = sliceMap.get(id);
      const absSlice = meta ? join(absDir, meta.filePath) : null;
      const text = absSlice && existsSync(absSlice) ? readFileSync(absSlice, 'utf-8') : '';
      return {
        sliceId: id,
        locationTag: meta?.locationTag || id,
        estimatedTokens: meta?.estimatedTokens || 0,
        needsVlmTriage: meta?.needsVlmTriage || false,
        overlapHints: meta?.overlapHints || [],
        content: text,
      };
    });

    return {
      module: mod,
      unit: plan.units.find((u) => u.unitCode === mod.unitCode),
      slices,
      authoringChecklist: [
        `Target profile: ${mod.knowledgeProfile} (estimated ${mod.estimatedMinutes} min)`,
        `Write UILA v2 JSON to ${join(absDir, mod.manifestPath || `modules/${mod.slug}.uila-v2.json`)}`,
        mod.needsSlideDeck
          ? `Build external Guizang HTML deck to ${join(absDir, mod.deckPath || `decks/${mod.slug}.html`)} with 1:1 slideIndex mapping`
          : 'Slide deck optional for this lightweight module (focus on clear text/examples)',
        `Preserve every technical detail & citation from the ${slices.length} attached source slice(s) (zero lossy omission)`,
        `Run \`flashlearn plan mark --dir "${absDir}" --module ${mod.slug} --state audited\`, then \`flashlearn plan push --dir "${absDir}" --module ${mod.slug}\``,
      ],
    };
  });

  return {
    projectSlug: plan.projectSlug,
    workspaceName: plan.workspaceName,
    scaleClass: plan.scaleClass,
    remainingModules: plan.modules.filter((m) => m.state !== 'published').length,
    knownGlossaryTerms: glossary.terms.slice(-40),
    nextBatch: packets,
  };
}
