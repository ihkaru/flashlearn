import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { CompetencyGraphEngine } from '../../../domain/services/CompetencyGraphEngine';
import type { LinkPrerequisiteDto } from '@flashlearn/shared';

export class LinkPrerequisiteUseCase {
  constructor(
    private readonly competencyRepo: ICompetencyRepository,
    private readonly graphEngine: CompetencyGraphEngine
  ) {}

  async execute(dto: LinkPrerequisiteDto): Promise<{ success: boolean; message: string }> {
    if (dto.competencyId === dto.prerequisiteId) {
      throw new Error('A competency node cannot be a prerequisite of itself');
    }

    const node = await this.competencyRepo.findById(dto.competencyId);
    if (!node) throw new Error(`Target competency '${dto.competencyId}' not found`);

    const prereq = await this.competencyRepo.findById(dto.prerequisiteId);
    if (!prereq) throw new Error(`Prerequisite competency '${dto.prerequisiteId}' not found`);

    if (node.workspaceId !== prereq.workspaceId) {
      throw new Error('Prerequisites must belong to the same workspace / domain');
    }

    // Cycle detection check
    const existingEdges = await this.competencyRepo.listEdges(node.workspaceId);
    const existingNodes = await this.competencyRepo.listByWorkspace(node.workspaceId);
    const nodeIds = existingNodes.map((n) => n.id);

    // Simulate candidate graph with the proposed new edge
    const candidateEdges = [
      ...existingEdges,
      { competencyId: dto.competencyId, prerequisiteId: dto.prerequisiteId },
    ];

    const hasCycle = this.graphEngine.hasCycle(nodeIds, candidateEdges);
    if (hasCycle) {
      throw new Error(
        `Cycle detected: Linking '${node.code}' to prerequisite '${prereq.code}' creates an illegal circular dependency!`
      );
    }

    await this.competencyRepo.addPrerequisite(dto.competencyId, dto.prerequisiteId);

    return {
      success: true,
      message: `Successfully linked prerequisite '${prereq.code}' -> '${node.code}'`,
    };
  }
}
