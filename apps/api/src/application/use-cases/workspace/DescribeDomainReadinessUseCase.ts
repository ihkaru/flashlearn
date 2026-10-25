import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { ISourceRepository } from '../../../domain/ports/ISourceRepository';
import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { IGateRepository } from '../../../domain/ports/IGateRepository';
import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { CompetencyGraphEngine } from '../../../domain/services/CompetencyGraphEngine';
import type { DomainDiagnosticReport } from '@flashlearn/shared';

export class DescribeDomainReadinessUseCase {
  constructor(
    private readonly workspaceRepo: IWorkspaceRepository,
    private readonly sourceRepo: ISourceRepository,
    private readonly competencyRepo: ICompetencyRepository,
    private readonly taskRepo: ITaskRepository,
    private readonly gateRepo: IGateRepository,
    private readonly contentRepo: IContentRepository,
    private readonly graphEngine: CompetencyGraphEngine
  ) {}

  async execute(workspaceIdOrSlug: string): Promise<DomainDiagnosticReport> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceIdOrSlug);
    let ws = isUUID ? await this.workspaceRepo.findById(workspaceIdOrSlug) : null;
    if (!ws) {
      ws = await this.workspaceRepo.findBySlug(workspaceIdOrSlug);
    }
    if (!ws) {
      throw new Error(`Domain/Workspace '${workspaceIdOrSlug}' not found`);
    }

    const workspaceId = ws.id;

    // 1. Fetch all domain entities in parallel
    const [sources, competencies, edges, gates, contents] = await Promise.all([
      this.sourceRepo.listByWorkspace(workspaceId),
      this.competencyRepo.listByWorkspace(workspaceId),
      this.competencyRepo.listEdges(workspaceId),
      this.gateRepo.listByWorkspace(workspaceId),
      this.contentRepo.listByWorkspace(workspaceId, false, false),
    ]);

    // 2. Chunks analysis
    let totalChunks = 0;
    const sourcesWithoutChunks: Array<{ id: string; code: string; title: string }> = [];
    let activeSourcesCount = 0;

    for (const src of sources) {
      if (src.status === 'active') activeSourcesCount++;
      const chunks = await this.sourceRepo.listChunksBySourceId(src.id);
      totalChunks += chunks.length;
      if (chunks.length === 0) {
        sourcesWithoutChunks.push({ id: src.id, code: src.code, title: src.title });
      }
    }

    // 3. Competencies & Task Analysis
    const compByClass = { A: 0, B: 0, C: 0 };
    const compByRisk = { low: 0, medium: 0, high: 0 };
    let approvedCount = 0;
    let totalTasks = 0;
    const tasksByType: Record<string, number> = {};
    const orphanCompetencies: Array<{ id: string; code: string; title: string }> = [];
    const unapprovedCompetencies: Array<{ id: string; code: string; title: string }> = [];
    const compWithoutSource: Array<{ id: string; code: string; title: string }> = [];

    for (const comp of competencies) {
      compByClass[comp.oracleClass] = (compByClass[comp.oracleClass] || 0) + 1;
      compByRisk[comp.riskLevel] = (compByRisk[comp.riskLevel] || 0) + 1;
      if (comp.isExpertApproved) approvedCount++;
      else unapprovedCompetencies.push({ id: comp.id, code: comp.code, title: comp.title });

      if (!comp.sourceId) {
        compWithoutSource.push({ id: comp.id, code: comp.code, title: comp.title });
      }

      const tasks = await this.taskRepo.listByCompetency(comp.id);
      totalTasks += tasks.length;
      if (tasks.length === 0) {
        orphanCompetencies.push({ id: comp.id, code: comp.code, title: comp.title });
      } else {
        for (const t of tasks) {
          tasksByType[t.taskType] = (tasksByType[t.taskType] || 0) + 1;
        }
      }
    }

    // 4. DAG Topology & Cycle Check
    const cycleDetected = this.graphEngine.hasCycle(competencies, edges);
    const prerequisiteTargetIds = new Set(edges.map((e) => e.competencyId));
    const prerequisiteSourceIds = new Set(edges.map((e) => e.prerequisiteId));

    const rootNodesCount = competencies.filter((c) => !prerequisiteTargetIds.has(c.id)).length;
    const terminalNodesCount = competencies.filter((c) => !prerequisiteSourceIds.has(c.id)).length;

    // 5. Gate Analysis
    const gateLevelsPresent = Array.from(new Set(gates.map((g) => g.level))).sort();
    const missingGateLevels = [0, 1, 2, 3].filter((lvl) => !gateLevelsPresent.includes(lvl));
    const gatesWithoutRequirements = gates
      .filter((g) => !g.requirements || g.requirements.length === 0)
      .map((g) => ({ id: g.id, level: g.level, title: g.title }));

    // 6. Content Analysis
    const contentsByType: Record<string, number> = {};
    for (const cnt of contents) {
      contentsByType[cnt.type] = (contentsByType[cnt.type] || 0) + 1;
    }

    // 7. Calculate Readiness Score (0-100)
    let score = 0;
    if (activeSourcesCount > 0 && totalChunks > 0) score += 20;
    if (competencies.length > 0 && !cycleDetected) score += 20;
    if (competencies.length > 0 && orphanCompetencies.length === 0) score += 25;
    else if (competencies.length > 0) {
      const taskCoverage = (competencies.length - orphanCompetencies.length) / competencies.length;
      score += Math.round(taskCoverage * 25);
    }
    if (missingGateLevels.length === 0) score += 20;
    else score += Math.round(((4 - missingGateLevels.length) / 4) * 20);
    if (contents.length > 0) score += 15;

    let status: DomainDiagnosticReport['readiness']['status'] = 'INCOMPLETE_DRAFT';
    if (cycleDetected) status = 'INVALID_CYCLE';
    else if (score >= 90) status = 'PRODUCTION_READY';
    else if (score >= 50) status = 'DEVELOPMENT_IN_PROGRESS';

    // 8. Actionable Recommendations for AI Agents
    const recommendations: DomainDiagnosticReport['recommendations'] = [];

    if (cycleDetected) {
      recommendations.push({
        issue: 'Circular dependency detected in competency DAG',
        severity: 'critical',
        suggestedCliCommand: `flashlearn competency graph --workspace-id ${workspaceId}`,
      });
    }

    for (const orphan of orphanCompetencies.slice(0, 5)) {
      recommendations.push({
        issue: `Competency '${orphan.code}' has 0 evaluation tasks`,
        severity: 'critical',
        suggestedCliCommand: `flashlearn task create --competency-id ${orphan.id} --title "Kasus ${orphan.code}" --scenario "<SCENARIO>" --type calculation --oracle-file <FILE> --rubric-file <FILE>`,
      });
    }

    for (const missingLvl of missingGateLevels) {
      recommendations.push({
        issue: `Missing authorization Gate Level ${missingLvl}`,
        severity: 'warning',
        suggestedCliCommand: `flashlearn gate create --workspace-id ${workspaceId} --level ${missingLvl} --title "Gate Level ${missingLvl}" --description "Otorisasi Level ${missingLvl}"`,
      });
    }

    if (contents.length === 0) {
      recommendations.push({
        issue: 'No educational reading materials registered for learner onboarding',
        severity: 'warning',
        suggestedCliCommand: `flashlearn content create --workspace-id ${workspaceId} --title "Pengantar Pembelajaran" --type materi --body "<MARKDOWN>"`,
      });
    }

    for (const unapp of unapprovedCompetencies.slice(0, 3)) {
      recommendations.push({
        issue: `Competency '${unapp.code}' awaits expert sign-off approval`,
        severity: 'info',
        suggestedCliCommand: `flashlearn competency approve ${unapp.id}`,
      });
    }

    return {
      workspace: {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        description: ws.description,
        isPublic: ws.isPublic,
        createdAt: ws.createdAt,
      },
      statistics: {
        sourcesCount: sources.length,
        activeSourcesCount,
        chunksCount: totalChunks,
        competenciesCount: competencies.length,
        competenciesByClass: compByClass,
        competenciesByRisk: compByRisk,
        approvedCompetenciesCount: approvedCount,
        edgesCount: edges.length,
        tasksCount: totalTasks,
        tasksByType,
        gatesCount: gates.length,
        gateLevelsPresent,
        contentsCount: contents.length,
        contentsByType,
      },
      dagIntegrity: {
        isValid: !cycleDetected,
        cycleDetected,
        rootNodesCount,
        terminalNodesCount,
      },
      gaps: {
        orphanCompetenciesWithoutTasks: orphanCompetencies,
        unapprovedCompetencies,
        competenciesWithoutSource: compWithoutSource,
        missingGateLevels,
        gatesWithoutRequirements,
        sourcesWithoutChunks,
        missingMaterials: contents.length === 0,
      },
      readiness: {
        score,
        status,
        summary: `Domain readiness score is ${score}%. ${orphanCompetencies.length} competencies lack tasks; ${missingGateLevels.length} gate levels missing.`,
      },
      recommendations,
    };
  }
}
