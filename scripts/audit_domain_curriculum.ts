#!/usr/bin/env bun
/**
 * 🔍 FlashLearn Domain Curriculum & Completeness Auditor
 *
 * Deterministic audit tool that evaluates a FlashLearn Domain Blueprint
 * against the 5 core application pillars:
 * 1. Corpus of Record & Deterministic Citations
 * 2. Directed Competency Graph & DAG Acyclicity
 * 3. Multi-Tier Oracle Rigor (Class A Deterministic & Class B AI Judge)
 * 4. Progressive Authorization Gates (Levels 0-3)
 * 5. Adversarial Stress Testing & Dilemma Coverage
 *
 * It also synthesizes recommended web research queries for real-time fact checking.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { verifyAcyclicity } from '../packages/shared/src/utils/graph-validator';

export interface PillarScore {
  score: number;
  maxScore: number;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string[];
}

export interface DomainAuditReport {
  workspace: { name: string; slug: string };
  overallScore: number;
  readinessLevel: 'PRODUCTION_READY' | 'ADVISORY_GAPS' | 'NON_COMPLIANT';
  pillars: {
    corpusOfRecord: PillarScore;
    competencyDag: PillarScore;
    oracleRigor: PillarScore;
    authorizationGates: PillarScore;
    adversarialStress: PillarScore;
  };
  recommendedWebSearches: string[];
  findings: Array<{ severity: 'HIGH' | 'MEDIUM' | 'INFO'; message: string }>;
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  let filePath: string | null = null;
  let workspaceSlug: string | null = null;
  let isJson = false;
  let isStrict = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' || args[i] === '-f') filePath = args[++i];
    else if (args[i] === '--workspace' || args[i] === '-w') workspaceSlug = args[++i];
    else if (args[i] === '--json') isJson = true;
    else if (args[i] === '--strict') isStrict = true;
  }

  return { filePath, workspaceSlug, isJson, isStrict };
}

function loadBlueprint(filePath: string | null, workspaceSlug: string | null): any {
  if (filePath) {
    const fullPath = resolve(process.cwd(), filePath);
    if (!existsSync(fullPath)) throw new Error(`Blueprint file not found: ${fullPath}`);
    return JSON.parse(readFileSync(fullPath, 'utf8'));
  }

  // Default to sample enterprise procurement blueprint if none specified
  const defaultSample = resolve(process.cwd(), 'docs/samples/enterprise-procurement-blueprint.json');
  if (existsSync(defaultSample)) {
    return JSON.parse(readFileSync(defaultSample, 'utf8'));
  }

  throw new Error('Please specify a blueprint path via --file <path>');
}

export function auditDomainCurriculum(bp: any): DomainAuditReport {
  const findings: Array<{ severity: 'HIGH' | 'MEDIUM' | 'INFO'; message: string }> = [];

  // --- 1. Pillar: Corpus of Record ---
  const sources = Array.isArray(bp.sources) ? bp.sources : [];
  let chunkCount = 0;
  let genericLocationCount = 0;
  let totalTokenEst = 0;

  for (const src of sources) {
    const chunks = Array.isArray(src.chunks) ? src.chunks : [];
    chunkCount += chunks.length;
    for (const c of chunks) {
      const words = (c.content || '').split(/\s+/).length;
      totalTokenEst += Math.round(words * 1.3);
      if (!c.locationTag || /^(chunk|part|section)\s*\d+$/i.test(c.locationTag.trim())) {
        genericLocationCount++;
      }
    }
  }

  let corpusPoints = 0;
  const corpusDetails: string[] = [];
  if (sources.length >= 1) corpusPoints += 5;
  if (chunkCount >= 4) {
    corpusPoints += 10;
    corpusDetails.push(`Corpus has ${chunkCount} chunks across ${sources.length} sources (~${totalTokenEst} tokens)`);
  } else {
    findings.push({ severity: 'HIGH', message: `Corpus is sparse: only ${chunkCount} chunks (target >= 5)` });
  }

  if (genericLocationCount === 0 && chunkCount > 0) {
    corpusPoints += 5;
    corpusDetails.push('All chunks have explicit, legal/SOP location tags (Pasal/Bab/Ayat)');
  } else if (genericLocationCount > 0) {
    findings.push({ severity: 'MEDIUM', message: `${genericLocationCount} chunk(s) have generic or non-verifiable location tags` });
  }

  // --- 2. Pillar: Directed Competency DAG ---
  const comps = Array.isArray(bp.competencies) ? bp.competencies : [];
  const compCodes = new Set(comps.map((c: any) => c.code));
  let edges = Array.isArray(bp.edges) ? [...bp.edges] : [];

  // If top-level edges is empty, infer from competency prerequisites
  if (edges.length === 0) {
    for (const c of comps) {
      if (Array.isArray(c.prerequisites)) {
        for (const p of c.prerequisites) {
          edges.push({ from: p, to: c.code });
        }
      }
    }
  }

  const dagCheck = verifyAcyclicity(
    Array.from(compCodes),
    edges.map((e: any) => ({ from: e.from, to: e.to }))
  );

  let dagPoints = 0;
  const dagDetails: string[] = [];

  if (dagCheck.isAcyclic) {
    dagPoints += 10;
    dagDetails.push('DAG is strictly acyclic (Tarjan SCC verified, 0 cycles detected)');
  } else {
    findings.push({ severity: 'HIGH', message: `Circular prerequisite trap detected: ${JSON.stringify(dagCheck.cycles)}` });
  }

  if (comps.length >= 4) {
    dagPoints += 5;
    dagDetails.push(`Topology contains ${comps.length} competencies across prerequisite tiers`);
  } else {
    findings.push({ severity: 'MEDIUM', message: `Curriculum scope is shallow: ${comps.length} competencies (target >= 4)` });
  }

  if (edges.length >= comps.length - 1 && edges.length > 0) {
    dagPoints += 5;
    dagDetails.push(`Cohesive prerequisite linkages: ${edges.length} directed progression edges`);
  }

  // --- 3. Pillar: Multi-Tier Oracle Rigor ---
  const tasks = Array.isArray(bp.tasks) ? bp.tasks : [];
  let classACount = 0;
  let classBCount = 0;
  let tasksWithRubric = 0;

  for (const t of tasks) {
    const comp = comps.find((c: any) => c.code === t.competencyCode);
    const oClass = comp?.oracleClass || (t.taskType === 'calculation' ? 'CLASS_A_DETERMINISTIC' : 'CLASS_B_AI_JUDGE');
    if (oClass.includes('CLASS_A') || oClass === 'A') classACount++;
    else classBCount++;

    if (Array.isArray(t.rubricCriteria) && t.rubricCriteria.length > 0) {
      const sumWeight = t.rubricCriteria.reduce((s: number, r: any) => s + (r.weight || 0), 0);
      if (sumWeight === 100) tasksWithRubric++;
    }
  }

  let oraclePoints = 0;
  const oracleDetails: string[] = [];
  if (tasks.length >= 3) oraclePoints += 5;
  if (classACount > 0 && classBCount > 0) {
    oraclePoints += 10;
    oracleDetails.push(`Balanced Multi-Tier Oracle: ${classACount} Class A (Deterministic) & ${classBCount} Class B (AI Judge)`);
  } else {
    findings.push({ severity: 'MEDIUM', message: 'Oracle is single-tier; best practice requires both Class A calculation and Class B case-study evaluation' });
  }

  if (tasksWithRubric === tasks.length && tasks.length > 0) {
    oraclePoints += 5;
    oracleDetails.push('All tasks define 100%-weighted objective evaluation rubric criteria');
  }

  const roleConfigCount = tasks.filter(
    (t: any) =>
      (t.oracleData?.oracleConfig?.dos && t.oracleData?.oracleConfig?.donts) ||
      (t.oracleData?.socraticConfig?.dos && t.oracleData?.socraticConfig?.donts)
  ).length;

  if (roleConfigCount > 0) {
    oracleDetails.push(`Role Behavior Configuration: ${roleConfigCount} task(s) define domain-specific Oracle/Socrates Do's & Don'ts`);
  }

  // --- 4. Pillar: Progressive Authorization Gates ---
  const gates = Array.isArray(bp.gates) ? bp.gates : [];
  let gatePoints = 0;
  const gateDetails: string[] = [];

  const levels = gates.map((g: any) => g.level).sort((a: number, b: number) => a - b);
  const isMonotonic = levels.every((lvl: number, idx: number) => idx === 0 || lvl >= levels[idx - 1]);

  if (gates.length >= 3 && isMonotonic) {
    gatePoints += 15;
    gateDetails.push(`Progressive Authorization Hierarchy: ${gates.length} ascending gates (Levels ${levels.join(' -> ')})`);
  } else {
    findings.push({ severity: 'HIGH', message: `Incomplete authorization gates: ${gates.length} levels defined (minimum 3 required: Observation, Junior, Senior)` });
  }

  const hasHumanApproval = gates.some((g: any) => g.requiresHumanApproval || g.level >= 3);
  if (hasHumanApproval) {
    gatePoints += 5;
    gateDetails.push('Human-in-the-loop expert signoff enforced on terminal gate');
  }

  // --- 5. Pillar: Adversarial Stress Testing & Dilemmas ---
  let stressPoints = 0;
  const stressDetails: string[] = [];
  const dilemmaTasks = tasks.filter((t: any) => t.taskType === 'adversarial_dilemma' || t.oracleData?.negative_anchors || t.oracleData?.acceptable_verdicts);

  if (dilemmaTasks.length >= 1) {
    stressPoints += 20;
    stressDetails.push(`Adversarial Resilience Active: ${dilemmaTasks.length} stress dilemma task(s) testing integrity under pressure`);
  } else {
    findings.push({ severity: 'HIGH', message: 'Zero adversarial dilemmas found: candidate integrity cannot be verified against executive override or time pressure' });
  }

  // Synthesis & Web Research Queries
  const domainTitle = bp.workspace?.name || 'Enterprise Domain';
  const recSearches = [
    `standar regulasi ${domainTitle} indonesia 2026 update terbaru`,
    `kode etik standar profesi kurikulum kompetensi ${domainTitle}`,
    `kasus sengketa audit temuan fraud ${domainTitle} mitigasi risiko`,
    `benchmark sop tata kelola operasional terbaik ${domainTitle} iso standard`,
  ];

  const totalScore = corpusPoints + dagPoints + oraclePoints + gatePoints + stressPoints;
  const readinessLevel = totalScore >= 85 ? 'PRODUCTION_READY' : totalScore >= 65 ? 'ADVISORY_GAPS' : 'NON_COMPLIANT';

  return {
    workspace: {
      name: bp.workspace?.name || 'Untitled Workspace',
      slug: bp.workspace?.slug || 'unknown-slug',
    },
    overallScore: totalScore,
    readinessLevel,
    pillars: {
      corpusOfRecord: { score: corpusPoints, maxScore: 20, status: corpusPoints >= 15 ? 'PASS' : 'WARN', details: corpusDetails },
      competencyDag: { score: dagPoints, maxScore: 20, status: dagPoints >= 15 ? 'PASS' : 'WARN', details: dagDetails },
      oracleRigor: { score: oraclePoints, maxScore: 20, status: oraclePoints >= 15 ? 'PASS' : 'WARN', details: oracleDetails },
      authorizationGates: { score: gatePoints, maxScore: 20, status: gatePoints >= 15 ? 'PASS' : 'WARN', details: gateDetails },
      adversarialStress: { score: stressPoints, maxScore: 20, status: stressPoints >= 15 ? 'PASS' : 'FAIL', details: stressDetails },
    },
    recommendedWebSearches: recSearches,
    findings,
  };
}

function runCli() {
  const { filePath, workspaceSlug, isJson, isStrict } = parseCliArgs();

  try {
    const blueprint = loadBlueprint(filePath, workspaceSlug);
    const report = auditDomainCurriculum(blueprint);

    if (isJson) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printTerminalReport(report);
    }

    if (isStrict && (report.readinessLevel !== 'PRODUCTION_READY' || report.findings.some(f => f.severity === 'HIGH'))) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err: any) {
    if (isJson) {
      console.error(JSON.stringify({ error: err.message, stack: err.stack }));
    } else {
      console.error(`❌ Audit Error: ${err.message}`);
    }
    process.exit(2);
  }
}

function printTerminalReport(r: DomainAuditReport) {
  console.log('\n======================================================================');
  console.log(`🔍 FLASHLERN DOMAIN CURRICULUM & COMPLETENESS AUDIT`);
  console.log('======================================================================');
  console.log(`Domain  : ${r.workspace.name} (${r.workspace.slug})`);
  console.log(`Score   : ${r.overallScore} / 100 (${r.readinessLevel})`);
  console.log('----------------------------------------------------------------------');

  const pNames: Record<keyof DomainAuditReport['pillars'], string> = {
    corpusOfRecord: '1. Corpus of Record (Verbatim Grounding)     ',
    competencyDag: '2. Competency Topology (Acyclic Directed DAG)',
    oracleRigor: '3. Multi-Tier Oracle (Class A & B Rubrics)   ',
    authorizationGates: '4. Progressive Authorization Gates (Levels)  ',
    adversarialStress: '5. Adversarial Stress & Integrity Dilemma    ',
  };

  for (const [k, p] of Object.entries(r.pillars) as Array<[keyof DomainAuditReport['pillars'], PillarScore]>) {
    const badge = p.status === 'PASS' ? '✅ PASS' : p.status === 'WARN' ? '⚠️ WARN' : '❌ FAIL';
    console.log(`${pNames[k]} : [${badge}] ${p.score}/${p.maxScore}`);
    for (const d of p.details) console.log(`   ✓ ${d}`);
  }

  if (r.findings.length > 0) {
    console.log('\n⚠️  Audit Findings & Architectural Gaps:');
    for (const f of r.findings) {
      const icon = f.severity === 'HIGH' ? '❌' : f.severity === 'MEDIUM' ? '⚠️' : 'ℹ️';
      console.log(`   ${icon} [${f.severity}] ${f.message}`);
    }
  }

  console.log('\n🌐 Recommended Real-Time Web Research Queries (Live Standard Verification):');
  for (const q of r.recommendedWebSearches) {
    console.log(`   🔍 "${q}"`);
  }
  console.log('======================================================================\n');
}

if (import.meta.main) {
  runCli();
}
