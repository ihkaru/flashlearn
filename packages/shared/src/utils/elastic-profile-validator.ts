import type { InteractiveModulePayload } from '../types/interactive';
import type { InteractiveValidationIssue } from './interactive-module-validator';

export function validateElasticProfileExtensions(
  payload: InteractiveModulePayload,
  issues: InteractiveValidationIssue[]
): void {
  const profile = payload.knowledgeProfile || 'bridging_understand';

  if (profile === 'micro_know') {
    const mk = payload.microKnow;
    if (!mk || !mk.coreIdea?.trim()) {
      issues.push({
        code: 'MISSING_MICRO_KNOW_CORE',
        severity: 'error',
        field: 'microKnow.coreIdea',
        message: 'micro_know profile requires microKnow.coreIdea (concise core concept).',
      });
    }
    if (!mk?.concreteExamples || mk.concreteExamples.length === 0) {
      issues.push({
        code: 'MISSING_MICRO_KNOW_EXAMPLES',
        severity: 'error',
        field: 'microKnow.concreteExamples',
        message: 'micro_know profile requires at least 1 concrete example.',
      });
    }
  }

  if (profile === 'procedural_do') {
    const hasErr = Boolean(payload.erroneousExample);
    const hasWorked = Boolean(payload.uila?.block4_notationContract?.workedExampleSummary?.trim());
    if (!hasErr && !hasWorked) {
      issues.push({
        code: 'MISSING_PROCEDURAL_PRACTICE',
        severity: 'error',
        field: 'erroneousExample',
        message:
          'procedural_do profile requires either erroneousExample (find-and-fix) or block4_notationContract.workedExampleSummary.',
      });
    }
  }

  if (profile === 'ill_structured_case') {
    const c = payload.illStructuredCase;
    if (!c || !c.dilemmaTitle?.trim() || !c.contextBrief?.trim()) {
      issues.push({
        code: 'MISSING_ILL_STRUCTURED_CASE',
        severity: 'error',
        field: 'illStructuredCase',
        message: 'ill_structured_case profile requires dilemmaTitle and contextBrief.',
      });
    }
    if (!c?.perspectives || c.perspectives.length < 2) {
      issues.push({
        code: 'INSUFFICIENT_PERSPECTIVES',
        severity: 'error',
        field: 'illStructuredCase.perspectives',
        message: 'ill_structured_case requires at least 2 distinct perspectives for corroboration.',
      });
    }
    if (!c?.rubricCriteria || c.rubricCriteria.length === 0) {
      issues.push({
        code: 'MISSING_RUBRIC_CRITERIA',
        severity: 'error',
        field: 'illStructuredCase.rubricCriteria',
        message: 'ill_structured_case requires at least 1 single-point rubric criterion.',
      });
    }
  }

  if (payload.hingeCheck) {
    const opts = payload.hingeCheck.options || [];
    const correctCount = opts.filter((o) => o.isCorrect).length;
    if (!payload.hingeCheck.prompt?.trim() || opts.length < 2 || correctCount !== 1) {
      issues.push({
        code: 'INVALID_HINGE_CHECK',
        severity: 'error',
        field: 'hingeCheck',
        message: 'hingeCheck requires a prompt, at least 2 options, and exactly 1 correct option.',
      });
    }
    if (!payload.hingeCheck.remediationCard?.trim()) {
      issues.push({
        code: 'MISSING_HINGE_REMEDIATION',
        severity: 'warning',
        field: 'hingeCheck.remediationCard',
        message: 'hingeCheck should provide a brief remediationCard for learners who miss it.',
      });
    }
  }

  if (payload.erroneousExample) {
    const ex = payload.erroneousExample;
    const stepExists = (ex.steps || []).some((s) => s.stepNumber === ex.flawedStepNumber);
    const fixCorrect = (ex.fixOptions || []).filter((f) => f.isCorrect).length;
    if (!stepExists || (ex.steps || []).length < 2) {
      issues.push({
        code: 'INVALID_ERRONEOUS_EXAMPLE_STEPS',
        severity: 'error',
        field: 'erroneousExample.steps',
        message: 'erroneousExample needs at least 2 steps and flawedStepNumber matching one of them.',
      });
    }
    if ((ex.fixOptions || []).length < 2 || fixCorrect !== 1) {
      issues.push({
        code: 'INVALID_ERRONEOUS_EXAMPLE_FIXES',
        severity: 'error',
        field: 'erroneousExample.fixOptions',
        message: 'erroneousExample requires >= 2 fixOptions with exactly 1 correct fix.',
      });
    }
  }

  if (payload.explainBack) {
    if (!payload.explainBack.prompt?.trim() || (payload.explainBack.referenceKeyPoints || []).length === 0) {
      issues.push({
        code: 'INVALID_EXPLAIN_BACK',
        severity: 'error',
        field: 'explainBack',
        message: 'explainBack requires a prompt and at least 1 referenceKeyPoint.',
      });
    }
    if (payload.explainBack.mode === 'select_causal_explanation') {
      const strongCount = (payload.explainBack.choices || []).filter((c) => c.isStrong).length;
      if ((payload.explainBack.choices || []).length < 2 || strongCount !== 1) {
        issues.push({
          code: 'INVALID_EXPLAIN_BACK_CHOICES',
          severity: 'error',
          field: 'explainBack.choices',
          message: 'select_causal_explanation explainBack requires >= 2 choices with exactly 1 strong explanation.',
        });
      }
    }
  }

  if (payload.unitMeta?.targetLectureMinutes && payload.unitMeta.targetLectureMinutes > 120) {
    issues.push({
      code: 'UNIT_LECTURE_BUDGET_EXCEEDED',
      severity: 'warning',
      field: 'unitMeta.targetLectureMinutes',
      message: 'University lecture unit budget should be <= 120 minutes; split into smaller lossless units.',
    });
  }
}
