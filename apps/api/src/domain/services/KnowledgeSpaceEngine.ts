/**
 * KnowledgeSpaceEngine.ts
 * Implements Knowledge Space Theory (Doignon & Falmagne) over Prerequisite DAGs.
 * Provides admissible state closures, topological fringe calculations, and minimal-entropy item selection.
 */

export interface PrerequisiteEdge {
  sourceId: string; // Prerequisite node
  targetId: string; // Dependent node
}

export class KnowledgeSpaceEngine {
  private readonly adjForward = new Map<string, string[]>(); // node -> dependents
  private readonly adjBackward = new Map<string, string[]>(); // node -> direct prerequisites
  private readonly allNodes: string[];

  constructor(nodes: string[], edges: PrerequisiteEdge[]) {
    this.allNodes = Array.from(new Set(nodes));
    for (const n of this.allNodes) {
      this.adjForward.set(n, []);
      this.adjBackward.set(n, []);
    }
    for (const e of edges) {
      if (this.adjForward.has(e.sourceId) && this.adjForward.has(e.targetId)) {
        this.adjForward.get(e.sourceId)!.push(e.targetId);
        this.adjBackward.get(e.targetId)!.push(e.sourceId);
      }
    }
  }

  getNodes(): string[] {
    return [...this.allNodes];
  }

  getDirectPrerequisites(nodeId: string): string[] {
    return this.adjBackward.get(nodeId) || [];
  }

  getDirectDependents(nodeId: string): string[] {
    return this.adjForward.get(nodeId) || [];
  }

  /**
   * Transitive ancestors (all transitive prerequisites of nodeId).
   */
  getAncestors(nodeId: string): string[] {
    const visited = new Set<string>();
    const stack = [...(this.adjBackward.get(nodeId) || [])];

    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (!visited.has(cur)) {
        visited.add(cur);
        for (const p of this.adjBackward.get(cur) || []) {
          if (!visited.has(p)) stack.push(p);
        }
      }
    }
    return Array.from(visited);
  }

  /**
   * Transitive descendants (all transitive dependents of nodeId).
   */
  getDescendants(nodeId: string): string[] {
    const visited = new Set<string>();
    const stack = [...(this.adjForward.get(nodeId) || [])];

    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (!visited.has(cur)) {
        visited.add(cur);
        for (const d of this.adjForward.get(cur) || []) {
          if (!visited.has(d)) stack.push(d);
        }
      }
    }
    return Array.from(visited);
  }

  /**
   * Outer Fringe F_out(K):
   * Unmastered competencies whose direct prerequisites are completely satisfied within K.
   */
  getOuterFringe(masteredIds: string[]): string[] {
    const masteredSet = new Set(masteredIds);
    const fringe: string[] = [];

    for (const n of this.allNodes) {
      if (masteredSet.has(n)) continue;
      const prereqs = this.adjBackward.get(n) || [];
      const allPrereqsSatisfied = prereqs.every((p) => masteredSet.has(p));
      if (allPrereqsSatisfied) {
        fringe.push(n);
      }
    }
    return fringe;
  }

  /**
   * Inner Fringe F_in(K):
   * Mastered competencies that have no dependents in K (the frontier boundary of achievement).
   */
  getInnerFringe(masteredIds: string[]): string[] {
    const masteredSet = new Set(masteredIds);
    const innerFringe: string[] = [];

    for (const n of masteredIds) {
      const dependents = this.adjForward.get(n) || [];
      const hasDependentInK = dependents.some((d) => masteredSet.has(d));
      if (!hasDependentInK) {
        innerFringe.push(n);
      }
    }
    return innerFringe;
  }

  /**
   * Validates whether a given subset of nodes forms an admissible knowledge state
   * (closed under prerequisites: b in K and a -> b implies a in K).
   */
  isAdmissibleState(stateNodes: string[]): boolean {
    const set = new Set(stateNodes);
    for (const n of stateNodes) {
      const prereqs = this.adjBackward.get(n) || [];
      for (const p of prereqs) {
        if (!set.has(p)) return false;
      }
    }
    return true;
  }

  /**
   * Minimal-Entropy Fringe Item Selector:
   * Selects the next probe from available unprobed outer fringe nodes.
   * Prioritizes nodes that test the highest frontier to maximize skip potential.
   */
  selectOptimalFringeProbe(masteredIds: string[], probedIds: string[]): string | null {
    const probedSet = new Set(probedIds);
    const outerFringe = this.getOuterFringe(masteredIds).filter((n) => !probedSet.has(n));

    if (outerFringe.length === 0) {
      // If no outer fringe items remain unprobed, check unprobed nodes whose prereqs are partially met
      const remaining = this.allNodes.filter((n) => !probedSet.has(n) && !masteredIds.includes(n));
      return remaining.length > 0 ? remaining[0] : null;
    }

    // Heuristic: pick the fringe node that has the highest number of transitive descendants
    // (maximizing downward Bayesian implication and fast-path placement)
    let bestNode = outerFringe[0];
    let maxDescendants = -1;

    for (const f of outerFringe) {
      const descCount = this.getDescendants(f).length;
      if (descCount > maxDescendants) {
        maxDescendants = descCount;
        bestNode = f;
      }
    }

    return bestNode;
  }

  /**
   * Propagates Bayesian mastery:
   * When a candidate passes targetNodeId, targetNodeId and ALL its transitive ancestors are mastered.
   */
  propagateAncestralMastery(currentMastered: string[], targetNodeId: string): string[] {
    const ancestors = this.getAncestors(targetNodeId);
    const set = new Set([...currentMastered, targetNodeId, ...ancestors]);
    return Array.from(set);
  }

  /**
   * Prunes descendant cone on failure:
   * When candidate fails targetNodeId, returns list of all descendants that cannot be mastered.
   */
  getPrunedDescendants(failedNodeId: string): string[] {
    return this.getDescendants(failedNodeId);
  }
}
