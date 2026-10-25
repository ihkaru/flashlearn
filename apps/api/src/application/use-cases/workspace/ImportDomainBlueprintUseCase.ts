import { createHash } from 'crypto';
import { validateDomainBlueprint, type DomainBlueprint, type ImportBlueprintResponse } from '@flashlearn/shared';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { ISourceRepository } from '../../../domain/ports/ISourceRepository';
import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { IGateRepository } from '../../../domain/ports/IGateRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { CompetencyGraphEngine } from '../../../domain/services/CompetencyGraphEngine';
import type { IAuditLogRepository } from '../../../domain/ports/IAuditLogRepository';

export class ImportDomainBlueprintUseCase {
  constructor(
    private readonly workspaceRepo: IWorkspaceRepository,
    private readonly sourceRepo: ISourceRepository,
    private readonly competencyRepo: ICompetencyRepository,
    private readonly gateRepo: IGateRepository,
    private readonly taskRepo: ITaskRepository,
    private readonly graphEngine: CompetencyGraphEngine,
    private readonly auditLogRepo?: IAuditLogRepository
  ) {}

  async execute(creatorId: string, blueprint: DomainBlueprint): Promise<ImportBlueprintResponse> {
    validateDomainBlueprint(blueprint);

    const wsSlug = blueprint.workspace.slug || blueprint.workspace.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // 1. Create or retrieve Workspace
    let workspace = await this.workspaceRepo.findBySlug(wsSlug);
    if (!workspace) {
      workspace = await this.workspaceRepo.create({
        name: blueprint.workspace.name,
        slug: wsSlug,
        description: blueprint.workspace.description,
        icon: blueprint.workspace.icon || '🎯',
        creatorId,
        isPublic: true,
      });
    }

    const workspaceId = workspace.id;

    // 2. Ingest Sources & Chunks
    let sourcesCreated = 0;
    const sourceCodeToIdMap = new Map<string, string>();

    for (const src of blueprint.sources || []) {
      let existingSrc = await this.sourceRepo.findByCode(src.code);
      if (!existingSrc) {
        existingSrc = await this.sourceRepo.create({
          workspaceId,
          code: src.code,
          title: src.title,
          version: src.version || '1.0',
          owner: src.owner || 'Standard Authority',
          effectiveDate: new Date(src.effectiveDate || Date.now()),
        });
        sourcesCreated++;

        // Insert chunks with SHA256 hashes
        if (src.chunks && src.chunks.length > 0) {
          const chunkData = src.chunks.map((chk) => ({
            sourceId: existingSrc.id,
            locationTag: chk.locationTag,
            content: chk.content,
            tokenCount: Math.ceil(chk.content.length / 4),
            sha256Hash: createHash('sha256').update(chk.content).digest('hex'),
          }));
          await this.sourceRepo.insertChunks(chunkData);
        }
      }
      sourceCodeToIdMap.set(src.code, existingSrc.id);
    }

    // 3. Create Competencies
    let competenciesCreated = 0;
    const compCodeToIdMap = new Map<string, string>();

    for (const comp of blueprint.competencies || []) {
      let existingComp = await this.competencyRepo.findByCode(workspaceId, comp.code);
      if (!existingComp) {
        const sourceId = comp.sourceCode ? sourceCodeToIdMap.get(comp.sourceCode) : undefined;
        existingComp = await this.competencyRepo.create({
          workspaceId,
          sourceId,
          code: comp.code,
          title: comp.title,
          description: comp.description || comp.title,
          oracleClass: comp.oracleClass,
          cognitiveArchetype: (comp as any).cognitiveArchetype || 'ill_structured_case',
          riskLevel: comp.riskLevel,
        });
        competenciesCreated++;
      }
      compCodeToIdMap.set(comp.code, existingComp.id);
    }

    // 4. Link DAG Edges
    let edgesLinked = 0;
    for (const comp of blueprint.competencies || []) {
      const compId = compCodeToIdMap.get(comp.code);
      if (!compId) continue;

      for (const prereqCode of comp.prerequisites || []) {
        const prereqId = compCodeToIdMap.get(prereqCode);
        if (prereqId && prereqId !== compId) {
          // Check cycle before adding
          const allNodes = await this.competencyRepo.listByWorkspace(workspaceId);
          const allEdges = await this.competencyRepo.listEdges(workspaceId);
          const candidateEdges = [...allEdges, { competencyId: compId, prerequisiteId: prereqId }];

          if (!this.graphEngine.hasCycle(allNodes.map((n) => n.id), candidateEdges)) {
            await this.competencyRepo.addPrerequisite(compId, prereqId);
            edgesLinked++;
          }
        }
      }
    }

    for (const edge of (blueprint as any).prerequisiteEdges || []) {
      const targetId = compCodeToIdMap.get(edge.targetCompetencyCode);
      const sourceId = compCodeToIdMap.get(edge.sourceCompetencyCode);
      if (targetId && sourceId && targetId !== sourceId) {
        const allNodes = await this.competencyRepo.listByWorkspace(workspaceId);
        const allEdges = await this.competencyRepo.listEdges(workspaceId);
        const candidateEdges = [...allEdges, { competencyId: targetId, prerequisiteId: sourceId }];

        if (!this.graphEngine.hasCycle(allNodes.map((n) => n.id), candidateEdges)) {
          await this.competencyRepo.addPrerequisite(targetId, sourceId);
          edgesLinked++;
        }
      }
    }

    // 5. Create Authorization Gates
    let gatesCreated = 0;
    for (const g of blueprint.gates || []) {
      const existingGate = await this.gateRepo.findByWorkspaceAndLevel(workspaceId, g.level);
      if (!existingGate) {
        const createdGate = await this.gateRepo.createGate({
          workspaceId,
          level: g.level,
          title: g.title || g.name,
          description: g.description || g.title || g.name,
        });
        gatesCreated++;

        const reqSource = g.requirements || (g.requiredCompetencyCodes || []).map((code: string) => ({
          competencyCode: code,
          minimumScore: 80,
          requiresHumanApproval: g.level >= 3,
        }));

        const requirements = reqSource
          .map((req: any) => {
            const cId = compCodeToIdMap.get(req.competencyCode);
            if (!cId) return null;
            return {
              competencyId: cId,
              minimumScore: req.minimumScore ?? 80,
              requiresHumanApproval: req.requiresHumanApproval ?? false,
            };
          })
          .filter(Boolean) as any[];

        if (requirements.length > 0) {
          await this.gateRepo.addRequirements(createdGate.id, requirements);
        }
      }
    }

    // 6. Create Tasks with Oracle Data
    let tasksCreated = 0;
    for (const t of blueprint.tasks || []) {
      const cId = compCodeToIdMap.get(t.competencyCode);
      if (!cId) continue;

      const existingTasks = await this.taskRepo.listByCompetency(cId);
      const duplicate = existingTasks.find((ex) => ex.title === t.title);
      if (!duplicate) {
        await this.taskRepo.create({
          competencyId: cId,
          title: t.title,
          scenario: t.scenario || t.title,
          taskType: t.taskType,
          oracleData: t.oracleData || {},
          adversarialSpec: t.adversarialSpec || null,
          rubricCriteria: t.rubricCriteria || [
            { id: 'crit_substance', title: 'Kesesuaian Prosedur', weight: 60, description: 'Kesesuaian dengan dokumen rujukan' },
            { id: 'crit_accuracy', title: 'Akurasi Eksekusi', weight: 40, description: 'Ketepatan hasil atau kalkulasi' },
          ],
          passingScore: t.passingScore ?? 80,
        });
        tasksCreated++;
      }
    }

    // 7. Append Immutable Audit Trail Log
    if (this.auditLogRepo) {
      await this.auditLogRepo.append({
        workspaceId,
        actorId: creatorId,
        action: 'CONTENT_GENERATED',
        targetType: 'content',
        targetId: workspaceId,
        payload: {
          actionDetail: 'UNIVERSAL_BLUEPRINT_IMPORTED',
          blueprintVersion: blueprint.version,
          sourcesCreated,
          competenciesCreated,
          edgesLinked,
          gatesCreated,
          tasksCreated,
        },
      });
    }

    return {
      workspaceId,
      workspaceSlug: wsSlug,
      sourcesCreated,
      competenciesCreated,
      edgesLinked,
      gatesCreated,
      tasksCreated,
    };
  }
}
