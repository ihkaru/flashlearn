import type { InteractiveModulePayload } from '../types/interactive';
import { validateElasticProfileExtensions } from './elastic-profile-validator';

export interface InteractiveValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  field: string;
  message: string;
}

export interface InteractiveValidationReport {
  valid: boolean;
  strictValid: boolean;
  issues: InteractiveValidationIssue[];
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateInteractiveModulePayload(
  payload: InteractiveModulePayload | null | undefined
): InteractiveValidationReport {
  const issues: InteractiveValidationIssue[] = [];

  if (!payload || payload.schemaVersion !== 'uila-v2' || !payload.uila) {
    issues.push({
      code: 'INVALID_SCHEMA_VERSION',
      severity: 'error',
      field: 'schemaVersion',
      message: 'Interactive module payload must declare schemaVersion "uila-v2" with a uila block set.',
    });
    return { valid: false, strictValid: false, issues };
  }

  const profile = payload.knowledgeProfile || 'bridging_understand';
  validateElasticProfileExtensions(payload, issues);

  const {
    groundingDecision,
    block1_anomaly,
    block2_grounding,
    block3_coreMechanics,
    block4_notationContract,
    block5_stressTest,
  } = payload.uila;

  if (profile !== 'micro_know') {
    if (!groundingDecision || !groundingDecision.mode || !groundingDecision.rationale?.trim()) {
      issues.push({
        code: 'GROUNDING_DECISION_REQUIRED',
        severity: 'error',
        field: 'uila.groundingDecision',
        message: 'Every non-micro module must declare a Clement-Brown groundingDecision (mode + rationale).',
      });
    } else {
      const mode = groundingDecision.mode;

      if (mode === 'experiential_anchor_bridge') {
        if (!block2_grounding?.anchoringLab) {
          issues.push({
            code: 'ANCHORING_LAB_REQUIRED',
            severity: 'error',
            field: 'uila.block2_grounding.anchoringLab',
            message: 'experiential_anchor_bridge requires an interactive anchoringLab before bridging.',
          });
        } else if (block2_grounding.anchoringLab.timeToAhaSeconds > 60) {
          issues.push({
            code: 'ANCHORING_SETUP_COST_EXCEEDED',
            severity: 'warning',
            field: 'uila.block2_grounding.anchoringLab.timeToAhaSeconds',
            message:
              'Anchoring lab exceeds 60s setup budget. Consider simplifying the interaction or switching to direct_formalism.',
          });
        }

        if (!block2_grounding?.bridgingChain || block2_grounding.bridgingChain.length === 0) {
          issues.push({
            code: 'MISSING_BRIDGING_CHAIN',
            severity: 'error',
            field: 'uila.block2_grounding.bridgingChain',
            message: 'experiential_anchor_bridge requires at least 1 bridgingChain structural mapping step.',
          });
        }

        if (!block2_grounding?.analogyBreakpoint?.whereItBreaks?.trim()) {
          issues.push({
            code: 'MISSING_ANALOGY_BREAKPOINT',
            severity: 'error',
            field: 'uila.block2_grounding.analogyBreakpoint',
            message: 'Every analogy or bridge must declare an analogyBreakpoint showing where the analogy stops holding.',
          });
        }
      }

      if (mode === 'direct_analogy') {
        if (!block2_grounding?.physicalObject?.trim()) {
          issues.push({
            code: 'MISSING_DIRECT_ANALOGY_ANCHOR',
            severity: 'error',
            field: 'uila.block2_grounding.physicalObject',
            message: 'direct_analogy mode requires a familiar physicalObject anchor.',
          });
        }
        if (!block2_grounding?.analogyBreakpoint?.whereItBreaks?.trim()) {
          issues.push({
            code: 'MISSING_ANALOGY_BREAKPOINT',
            severity: 'error',
            field: 'uila.block2_grounding.analogyBreakpoint',
            message: 'direct_analogy mode requires an explicit analogyBreakpoint to prevent false literal transfer.',
          });
        }
      }

      if (mode === 'thought_experiment') {
        if (!block2_grounding?.thoughtExperimentSteps || block2_grounding.thoughtExperimentSteps.length < 2) {
          issues.push({
            code: 'MISSING_THOUGHT_EXPERIMENT_STEPS',
            severity: 'error',
            field: 'uila.block2_grounding.thoughtExperimentSteps',
            message: 'thought_experiment mode requires at least 2 progressive thoughtExperimentSteps.',
          });
        }
      }

      if (mode !== 'direct_formalism' && groundingDecision.setupCostSeconds > 180) {
        issues.push({
          code: 'FORCED_ANALOGY_EFFICIENCY_WARNING',
          severity: 'warning',
          field: 'uila.groundingDecision.setupCostSeconds',
          message: 'Setup cost exceeds 180s; evaluate switching to direct_formalism if formal rules can be grasped faster.',
        });
      }
    }

    if (!block1_anomaly?.groundState?.trim() || !block1_anomaly?.breakdownPoint?.trim()) {
      issues.push({
        code: 'INCOMPLETE_ANOMALY_BLOCK',
        severity: 'error',
        field: 'uila.block1_anomaly',
        message: 'Block 1 must articulate both groundState and breakdownPoint without jargon overload.',
      });
    }

    if (!block3_coreMechanics?.invariantProperty?.trim()) {
      issues.push({
        code: 'MISSING_CORE_INVARIANT',
        severity: 'error',
        field: 'uila.block3_coreMechanics.invariantProperty',
        message: 'Block 3 must isolate a clear invariantProperty.',
      });
    }

    if (!block3_coreMechanics?.contrastingCases || block3_coreMechanics.contrastingCases.length === 0) {
      issues.push({
        code: 'MISSING_CONTRASTING_CASES',
        severity: 'warning',
        field: 'uila.block3_coreMechanics.contrastingCases',
        message: 'Block 3 should include at least 1 contrasting case (beginnerMisconception vs physicalReality).',
      });
    }

    if (profile !== 'ill_structured_case' && !block4_notationContract?.minimalFormalization?.trim()) {
      issues.push({
        code: 'MISSING_NOTATION_CONTRACT',
        severity: 'error',
        field: 'uila.block4_notationContract.minimalFormalization',
        message: 'Block 4 must provide minimalFormalization explaining the shorthand contract.',
      });
    }
  }

  if (!block5_stressTest || !block5_stressTest.prompt?.trim()) {
    issues.push({
      code: 'MISSING_STRESS_TEST',
      severity: 'error',
      field: 'uila.block5_stressTest',
      message: 'Block 5 diagnostic check / stress test probe is mandatory.',
    });
  } else {
    const promptWords = wordCount(block5_stressTest.prompt);
    if (promptWords > 55) {
      issues.push({
        code: 'WORKING_MEMORY_OVERFLOW',
        severity: 'warning',
        field: 'uila.block5_stressTest.prompt',
        message: `Stress test prompt has ${promptWords} words (target <= 50 words for working memory clarity).`,
      });
    }

    const opts = block5_stressTest.options || [];
    const minOpts = profile === 'micro_know' ? 2 : 3;
    if (opts.length < minOpts) {
      issues.push({
        code: 'INSUFFICIENT_DIAGNOSTIC_OPTIONS',
        severity: 'error',
        field: 'uila.block5_stressTest.options',
        message: `Block 5 requires at least ${minOpts} options.`,
      });
    }

    const correctCount = opts.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      issues.push({
        code: 'INVALID_CORRECT_OPTION_COUNT',
        severity: 'error',
        field: 'uila.block5_stressTest.options',
        message: `Expected exactly 1 correct option, found ${correctCount}.`,
      });
    }

    for (const opt of opts) {
      if (!opt.causalRationale?.trim()) {
        issues.push({
          code: 'INCOMPLETE_DISTRACTOR_RATIONALE',
          severity: 'error',
          field: `uila.block5_stressTest.options.${opt.optionId}`,
          message: `Option "${opt.optionId}" is missing a causalRationale.`,
        });
      }
      if (!opt.isCorrect && !opt.diagnosticAxis) {
        issues.push({
          code: 'INCOMPLETE_DISTRACTOR_RATIONALE',
          severity: 'error',
          field: `uila.block5_stressTest.options.${opt.optionId}`,
          message: `Distractor "${opt.optionId}" must map to a 5-axis diagnosticAxis.`,
        });
      }
    }
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  return {
    valid: errorCount === 0,
    strictValid: issues.length === 0,
    issues,
  };
}
