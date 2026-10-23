import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { IMasteryRepository } from '../../../domain/ports/IMasteryRepository';
import type { CompetencyGraphEngine } from '../../../domain/services/CompetencyGraphEngine';
import type { CompetencyGraphResponse } from '@flashlearn/shared';

export class GetCompetencyGraphUseCase {
  constructor(
    private readonly competencyRepo: ICompetencyRepository,
    private readonly masteryRepo: IMasteryRepository,
    private readonly graphEngine: CompetencyGraphEngine
  ) {}

  async execute(workspaceId: string, userId?: string | null): Promise<CompetencyGraphResponse> {
    const nodes = await this.competencyRepo.listByWorkspace(workspaceId);
    const edges = await this.competencyRepo.listEdges(workspaceId);

    const nodeIds = nodes.map((n) => n.id);
    const masteryMap = userId
      ? await this.masteryRepo.batchGetStatus(userId, nodeIds)
      : new Map();

    const evaluatedNodes = this.graphEngine.evaluateLearnerProgression(nodes, edges, masteryMap);

    const summary = {
      locked: 0,
      ready: 0,
      inProgress: 0,
      mastered: 0,
      stale: 0,
    };

    for (const item of evaluatedNodes) {
      if (item.userStatus === 'locked') summary.locked++;
      else if (item.userStatus === 'ready') summary.ready++;
      else if (item.userStatus === 'in_progress') summary.inProgress++;
      else if (item.userStatus === 'mastered') summary.mastered++;
      else if (item.userStatus === 'stale') summary.stale++;
    }

    return {
      workspaceId,
      totalNodes: nodes.length,
      nodes: evaluatedNodes,
      edges,
      summary,
    };
  }
}
