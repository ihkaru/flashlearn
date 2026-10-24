import { verifyAcyclicity } from './graph-validator';

export interface BlueprintValidationResult {
  isValid: boolean;
  statistics: {
    sourcesCount: number;
    chunksCount: number;
    competenciesCount: number;
    edgesCount: number;
    gatesCount: number;
    tasksCount: number;
  };
}

export function validateDomainBlueprint(bp: any): BlueprintValidationResult {
  if (!bp || typeof bp !== 'object') {
    throw new Error('INVALID_DOMAIN_BLUEPRINT: Blueprint payload must be a non-null JSON object');
  }

  // 1. Validate Workspace
  if (!bp.workspace || typeof bp.workspace !== 'object') {
    throw new Error('INVALID_DOMAIN_BLUEPRINT: Missing "workspace" metadata object');
  }
  if (!bp.workspace.name || typeof bp.workspace.name !== 'string' || bp.workspace.name.trim().length < 2) {
    throw new Error('INVALID_DOMAIN_BLUEPRINT: "workspace.name" must be a string with at least 2 characters');
  }

  // 2. Validate Sources
  if (!Array.isArray(bp.sources) || bp.sources.length === 0) {
    throw new Error('INSUFFICIENT_DOMAIN_SPECIFICATION: Blueprint must include at least 1 source document in "sources"');
  }

  let totalChunks = 0;
  const sourceCodes = new Set<string>();
  for (let i = 0; i < bp.sources.length; i++) {
    const src = bp.sources[i];
    if (!src.code || typeof src.code !== 'string') {
      throw new Error(`INVALID_DOMAIN_BLUEPRINT: Source at index ${i} is missing "code"`);
    }
    if (!src.title || typeof src.title !== 'string') {
      throw new Error(`INVALID_DOMAIN_BLUEPRINT: Source "${src.code}" is missing "title"`);
    }
    sourceCodes.add(src.code);

    if (Array.isArray(src.chunks)) {
      totalChunks += src.chunks.length;
      for (let c = 0; c < src.chunks.length; c++) {
        const chk = src.chunks[c];
        if (!chk.locationTag || !chk.content) {
          throw new Error(
            `INVALID_DOMAIN_BLUEPRINT: Chunk at index ${c} in source "${src.code}" must have "locationTag" and "content"`
          );
        }
      }
    }
  }

  // 3. Validate Competencies
  if (!Array.isArray(bp.competencies) || bp.competencies.length < 2) {
    throw new Error('INSUFFICIENT_DOMAIN_SPECIFICATION: Blueprint must define at least 2 competencies in "competencies"');
  }

  const compCodes = new Set<string>();
  for (let i = 0; i < bp.competencies.length; i++) {
    const c = bp.competencies[i];
    if (!c.code || typeof c.code !== 'string') {
      throw new Error(`INVALID_DOMAIN_BLUEPRINT: Competency at index ${i} is missing "code"`);
    }
    if (!c.title || typeof c.title !== 'string') {
      throw new Error(`INVALID_DOMAIN_BLUEPRINT: Competency "${c.code}" is missing "title"`);
    }
    if (compCodes.has(c.code)) {
      throw new Error(`INVALID_DOMAIN_BLUEPRINT: Duplicate competency code "${c.code}"`);
    }
    compCodes.add(c.code);
  }

  // 4. Validate Prerequisite DAG Acyclicity
  const edges: Array<{ from: string; to: string }> = [];
  if (Array.isArray(bp.prerequisiteEdges)) {
    for (const e of bp.prerequisiteEdges) {
      if (!compCodes.has(e.sourceCompetencyCode) || !compCodes.has(e.targetCompetencyCode)) {
        throw new Error(
          `INVALID_DOMAIN_BLUEPRINT: Prerequisite edge references unknown competency: ${e.sourceCompetencyCode} -> ${e.targetCompetencyCode}`
        );
      }
      edges.push({ from: e.sourceCompetencyCode, to: e.targetCompetencyCode });
    }
  }

  for (const c of bp.competencies) {
    if (Array.isArray(c.prerequisites)) {
      for (const p of c.prerequisites) {
        if (!compCodes.has(p)) {
          throw new Error(`INVALID_DOMAIN_BLUEPRINT: Competency "${c.code}" references unknown prerequisite "${p}"`);
        }
        edges.push({ from: p, to: c.code });
      }
    }
  }

  const acyclic = verifyAcyclicity(Array.from(compCodes), edges);
  if (!acyclic.isAcyclic) {
    throw new Error(
      `INVALID_DOMAIN_BLUEPRINT: Prerequisite graph contains cyclic loops: ${JSON.stringify(acyclic.cycles)}`
    );
  }

  // 5. Validate Gates
  if (!Array.isArray(bp.gates) || bp.gates.length === 0) {
    throw new Error('INSUFFICIENT_DOMAIN_SPECIFICATION: Blueprint must define at least 1 authorization gate');
  }

  for (let i = 0; i < bp.gates.length; i++) {
    const g = bp.gates[i];
    if (g.level === undefined || typeof g.level !== 'number') {
      throw new Error(`INVALID_DOMAIN_BLUEPRINT: Gate at index ${i} is missing numeric "level"`);
    }
    if (!g.title && !g.name) {
      throw new Error(`INVALID_DOMAIN_BLUEPRINT: Gate level ${g.level} is missing "title" or "name"`);
    }
  }

  // 6. Validate Tasks
  const tasks = Array.isArray(bp.tasks) ? bp.tasks : [];
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    if (!t.competencyCode || !compCodes.has(t.competencyCode)) {
      throw new Error(`INVALID_DOMAIN_BLUEPRINT: Task at index ${i} references unknown competency "${t.competencyCode}"`);
    }
    if (!t.title || !t.taskType) {
      throw new Error(`INVALID_DOMAIN_BLUEPRINT: Task at index ${i} is missing "title" or "taskType"`);
    }
    if (t.taskType === 'adversarial_dilemma' && !t.adversarialSpec) {
      throw new Error(
        `INVALID_DOMAIN_BLUEPRINT: Task "${t.title}" is of type adversarial_dilemma but missing "adversarialSpec"`
      );
    }
  }

  return {
    isValid: true,
    statistics: {
      sourcesCount: bp.sources.length,
      chunksCount: totalChunks,
      competenciesCount: bp.competencies.length,
      edgesCount: edges.length,
      gatesCount: bp.gates.length,
      tasksCount: tasks.length,
    },
  };
}
