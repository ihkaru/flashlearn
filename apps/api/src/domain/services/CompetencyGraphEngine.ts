import type { CompetencyEntity } from '../entities/Competency';
import type { MasteryRecordEntity } from '../entities/MasteryRecord';
import type {
  LearnerCompetencyStatus,
  CompetencyEdge,
  MasteryStatus,
} from '@flashlearn/shared';

export class CompetencyGraphEngine {
  /**
   * Detects whether adding an edge (or existing graph) contains a cycle using DFS.
   */
  hasCycle(nodeIds: string[], edges: Array<{ competencyId: string; prerequisiteId: string }>): boolean {
    const adj = new Map<string, string[]>();
    for (const id of nodeIds) {
      adj.set(id, []);
    }
    for (const edge of edges) {
      const list = adj.get(edge.competencyId);
      if (list) {
        list.push(edge.prerequisiteId);
      }
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (curr: string): boolean => {
      visited.add(curr);
      recStack.add(curr);

      const neighbors = adj.get(curr) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true; // Cycle detected
        }
      }

      recStack.delete(curr);
      return false;
    };

    for (const id of nodeIds) {
      if (!visited.has(id)) {
        if (dfs(id)) return true;
      }
    }

    return false;
  }

  /**
   * Evaluates learner progression across all nodes in a workspace DAG.
   */
  evaluateLearnerProgression(
    nodes: CompetencyEntity[],
    edges: CompetencyEdge[],
    masteryMap: Map<string, MasteryRecordEntity>
  ): LearnerCompetencyStatus[] {
    const nodeMap = new Map<string, CompetencyEntity>();
    for (const node of nodes) {
      nodeMap.set(node.id, node);
    }

    // Map each competency to its prerequisites
    const prereqMap = new Map<string, string[]>();
    for (const node of nodes) {
      prereqMap.set(node.id, []);
    }
    for (const edge of edges) {
      const list = prereqMap.get(edge.competencyId);
      if (list) {
        list.push(edge.prerequisiteId);
      }
    }

    const results: LearnerCompetencyStatus[] = [];

    for (const node of nodes) {
      const record = masteryMap.get(node.id);
      const rawStatus: MasteryStatus = record ? record.status : 'ready';

      const prereqIds = prereqMap.get(node.id) || [];
      const unmasteredPrereqs: Array<{ id: string; code: string; title: string }> = [];

      for (const pId of prereqIds) {
        const pRecord = masteryMap.get(pId);
        const isPrereqMastered = pRecord ? pRecord.isMastered() : false;
        if (!isPrereqMastered) {
          const pNode = nodeMap.get(pId);
          unmasteredPrereqs.push({
            id: pId,
            code: pNode?.code || 'UNKNOWN',
            title: pNode?.title || 'Prerequisite',
          });
        }
      }

      let userStatus: MasteryStatus = rawStatus;
      let canAttempt = false;

      if (rawStatus === 'mastered') {
        userStatus = 'mastered';
        canAttempt = false;
      } else if (rawStatus === 'stale') {
        userStatus = 'stale';
        canAttempt = true;
      } else if (unmasteredPrereqs.length > 0) {
        userStatus = 'locked';
        canAttempt = false;
      } else if (rawStatus === 'in_progress') {
        userStatus = 'in_progress';
        canAttempt = true;
      } else {
        userStatus = 'ready';
        canAttempt = true;
      }

      results.push({
        id: node.id,
        workspaceId: node.workspaceId,
        sourceId: node.sourceId,
        code: node.code,
        title: node.title,
        description: node.description,
        oracleClass: node.oracleClass,
        riskLevel: node.riskLevel,
        isExpertApproved: node.isExpertApproved,
        approvedBy: node.approvedBy,
        prerequisiteIds: prereqIds,
        userStatus,
        canAttempt,
        blockingPrerequisites: unmasteredPrereqs,
        createdAt: node.props.createdAt.toISOString(),
        updatedAt: node.props.updatedAt.toISOString(),
      });
    }

    return results;
  }
}
