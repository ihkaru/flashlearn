import { verifyAcyclicity, type AcyclicityResult } from './graph-validator';
import { validateDomainBlueprint, type BlueprintValidationResult } from './blueprint-validator';

export { verifyAcyclicity, validateDomainBlueprint };
export type { AcyclicityResult, BlueprintValidationResult };

export interface DomainSynthesisResult {
  blueprint: any;
  dagIsAcyclic: boolean;
  statistics: BlueprintValidationResult['statistics'];
}

/**
 * Validates and certifies an agent-synthesized Domain Blueprint.
 * Throws explicit typed domain errors if requirements or invariants are breached.
 */
export function certifyDomainBlueprint(blueprint: any): DomainSynthesisResult {
  const validation = validateDomainBlueprint(blueprint);
  return {
    blueprint,
    dagIsAcyclic: validation.isValid,
    statistics: validation.statistics,
  };
}
