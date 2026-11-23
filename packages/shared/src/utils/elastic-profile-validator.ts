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

  const allHingeChecks = [
    ...(payload.hingeCheck ? [{ item: payload.hingeCheck, field: 'hingeCheck' }] : []),
    ...(payload.additionalHingeChecks || []).map((item, idx) => ({
      item,
      field: `additionalHingeChecks[${idx}]`,
    })),
  ];
  for (const { item: hc, field } of allHingeChecks) {
    const opts = hc.options || [];
    const correctCount = opts.filter((o) => o.isCorrect).length;
    if (!hc.prompt?.trim() || opts.length < 2 || correctCount !== 1) {
      issues.push({
        code: 'INVALID_HINGE_CHECK',
        severity: 'error',
        field,
        message: `${field} requires a prompt, at least 2 options, and exactly 1 correct option.`,
      });
    }
    if (!hc.remediationCard?.trim()) {
      issues.push({
        code: 'MISSING_HINGE_REMEDIATION',
        severity: 'warning',
        field: `${field}.remediationCard`,
        message: `${field} should provide a brief remediationCard for learners who miss it.`,
      });
    }
  }

  const allErroneous = [
    ...(payload.erroneousExample ? [{ item: payload.erroneousExample, field: 'erroneousExample' }] : []),
    ...(payload.additionalErroneousExamples || []).map((item, idx) => ({
      item,
      field: `additionalErroneousExamples[${idx}]`,
    })),
  ];
  for (const { item: ex, field } of allErroneous) {
    const stepExists = (ex.steps || []).some((s) => s.stepNumber === ex.flawedStepNumber);
    const fixCorrect = (ex.fixOptions || []).filter((f) => f.isCorrect).length;
    if (!stepExists || (ex.steps || []).length < 2) {
      issues.push({
        code: 'INVALID_ERRONEOUS_EXAMPLE_STEPS',
        severity: 'error',
        field: `${field}.steps`,
        message: `${field} needs at least 2 steps and flawedStepNumber matching one of them.`,
      });
    }
    if ((ex.fixOptions || []).length < 2 || fixCorrect !== 1) {
      issues.push({
        code: 'INVALID_ERRONEOUS_EXAMPLE_FIXES',
        severity: 'error',
        field: `${field}.fixOptions`,
        message: `${field} requires >= 2 fixOptions with exactly 1 correct fix.`,
      });
    }
  }

  for (const [idx, probe] of (payload.additionalStressTests || []).entries()) {
    const field = `additionalStressTests[${idx}]`;
    const opts = probe.options || [];
    const correctCount = opts.filter((o) => o.isCorrect).length;
    if (!probe.prompt?.trim() || opts.length < 2 || correctCount !== 1) {
      issues.push({
        code: 'INVALID_ADDITIONAL_STRESS_TEST',
        severity: 'error',
        field,
        message: `${field} requires a prompt, >= 2 options, and exactly 1 correct option.`,
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

  if (payload.figures && payload.figures.length > 0) {
    payload.figures.forEach((fig, idx) => {
      if (!fig.id?.trim() || !fig.assetUrl?.trim() || !fig.caption?.trim() || !fig.altText?.trim()) {
        issues.push({
          code: 'INVALID_MODULE_FIGURE',
          severity: 'error',
          field: `figures[${idx}]`,
          message: 'Each module figure requires non-empty id, assetUrl, caption, and altText.',
        });
      }
    });
  }

  auditUnexplainedAcronyms(payload, issues);
}

const UNIVERSAL_SHORT_TOKENS = new Set([
  // Everyday universal abbreviations & units
  'MIT', 'AS', 'RI', 'SD', 'SMP', 'SMA', 'SMK', 'IPA', 'IPS', 'HP', 'TV', 'ID', 'RP', 'UU',
  'AI', 'UI', 'UX', 'IT', 'PC', 'OS', 'JS', 'TS', 'SQL', 'PDF', 'PPT', 'HTML',
  'HTTP', 'HTTPS', 'URL', 'API', 'JSON', 'CLI', 'CSS', 'IGD', 'USD', 'IDR', 'USA',
  'RAM', 'CPU', 'GPU', 'USB', 'SMS', 'ATM', 'KTP', 'SIM', 'GPS', 'PIN', 'OTP', 'LED', 'LCD',
  'WIB', 'WITA', 'WIT', 'UTC', 'GMT',
  // Common Indonesian & English emphatic ALL-CAPS words & SQL keywords (not jargon acronyms)
  'DAN', 'YANG', 'ATAU', 'TIDAK', 'BUKAN', 'TANPA', 'SATU', 'DUA', 'TIGA', 'SEMUA',
  'HARUS', 'WAJIB', 'BOLEH', 'HANYA', 'PALING', 'SANGAT', 'LEBIH', 'DARI', 'UNTUK',
  'DENGAN', 'KARENA', 'SAAT', 'BILA', 'JIKA', 'MAKA', 'AKAN', 'TELAH', 'SUDAH',
  'BELUM', 'JADI', 'BISA', 'DAPAT', 'ADA', 'GURU', 'BUKU',
  'AND', 'THE', 'FOR', 'NOT', 'ALL', 'ONE', 'ONLY', 'MUST', 'WITH', 'FROM', 'THAT',
  'THIS', 'BUT', 'ARE', 'WAS', 'YOU', 'YOUR', 'CAN', 'HOW', 'WHY', 'WHAT', 'WHEN',
  'ZERO', 'MAX', 'MIN', 'NEW', 'OLD', 'PRO', 'TOP', 'END', 'LOW', 'HIGH', 'TRUE',
  'FALSE', 'NULL', 'NONE', 'SELECT', 'WHERE', 'LIMIT', 'OFFSET', 'ORDER', 'GROUP',
]);

function collectModuleProse(payload: InteractiveModulePayload): string {
  const parts: string[] = [payload.learningObjective || ''];
  if (payload.microKnow) {
    parts.push(
      payload.microKnow.coreIdea,
      payload.microKnow.whyItMatters,
      ...(payload.microKnow.concreteExamples || []).flatMap((e) => [e.label, e.detail]),
      ...(payload.microKnow.keyTakeaways || [])
    );
  }
  const u = payload.uila;
  if (u) {
    parts.push(
      u.block1_anomaly?.groundState || '',
      u.block1_anomaly?.oldWay || '',
      u.block1_anomaly?.breakdownPoint || '',
      u.block2_grounding?.physicalObject || '',
      u.block2_grounding?.isomorphicMapping || '',
      u.block2_grounding?.analogyBreakpoint?.whereItBreaks || '',
      u.block2_grounding?.analogyBreakpoint?.realMechanismInstead || '',
      ...(u.block2_grounding?.thoughtExperimentSteps || []),
      ...(u.block2_grounding?.bridgingChain || []).flatMap((b) => [
        b.stepTitle,
        b.bridgeScenario,
        b.invariantPreserved,
        ...b.structuralMapping.flatMap((m) => [m.anchorElement, m.targetConcept, m.whyItMatches]),
      ]),
      u.block3_coreMechanics?.invariantProperty || '',
      ...(u.block3_coreMechanics?.variableComponents || []),
      ...(u.block3_coreMechanics?.contrastingCases || []).flatMap((c) => [c.beginnerMisconception, c.physicalReality]),
      u.block4_notationContract?.minimalFormalization || '',
      u.block4_notationContract?.workedExampleSummary || '',
      u.block5_stressTest?.prompt || '',
      ...(u.block5_stressTest?.options || []).flatMap((o) => [o.text, o.causalRationale])
    );
  }
  for (const hc of [payload.hingeCheck, ...(payload.additionalHingeChecks || [])]) {
    if (hc) parts.push(hc.prompt, hc.remediationCard);
  }
  for (const ex of [payload.erroneousExample, ...(payload.additionalErroneousExamples || [])]) {
    if (ex) {
      parts.push(
        ex.scenarioPrompt,
        ex.takeaway,
        ...(ex.steps || []).map((s) => `${s.label} ${s.content}`)
      );
    }
  }
  for (const st of payload.additionalStressTests || []) {
    parts.push(st.prompt, ...(st.options || []).flatMap((o) => [o.text, o.causalRationale]));
  }
  if (payload.illStructuredCase) {
    parts.push(
      payload.illStructuredCase.contextBrief,
      payload.illStructuredCase.corroborationQuestion,
      ...(payload.illStructuredCase.perspectives || []).flatMap((p) => [
        p.actorOrSchool,
        p.claim,
        p.supportingEvidence,
        p.blindSpot,
      ])
    );
  }
  if (payload.explainBack) {
    parts.push(payload.explainBack.prompt, ...(payload.explainBack.referenceKeyPoints || []));
  }
  return parts.join('\n');
}

function isAcronymExplainedInline(text: string, acronym: string): boolean {
  const esc = acronym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Matches: "Long Name (ACR)", "ACR (penjelasan...)", "ACR =", "ACR —", "ACR:"
  const patterns = [
    new RegExp(`[A-Za-z][A-Za-z0-9\\s-]{4,}\\(${esc}\\)`),
    new RegExp(`\\b${esc}\\s*\\([^)]{4,}\\)`),
    new RegExp(`\\b${esc}\\s*(?:=|—|-\\s+|:|adalah|yaitu|artinya)`),
  ];
  return patterns.some((re) => re.test(text));
}

function auditUnexplainedAcronyms(
  payload: InteractiveModulePayload,
  issues: InteractiveValidationIssue[]
): void {
  const fullText = collectModuleProse(payload);
  const glossaryBlob = [
    ...(payload.glossary || []).map((g) => `${g.term} ${g.definition}`),
    ...(payload.figures || []).flatMap((f) =>
      (f.annotations || []).map((a) => `${a.label} ${a.explanation}`)
    ),
    ...(payload.uila?.block4_notationContract?.termsDeconstruction || []).map(
      (t) => `${t.symbol} ${t.physicalMeaning}`
    ),
  ].join(' ');

  const matches = fullText.match(/\b[A-Z]{3,6}\b/g) || [];
  const unexplained = new Set<string>();

  for (const token of matches) {
    if (UNIVERSAL_SHORT_TOKENS.has(token)) continue;
    if (glossaryBlob.includes(token)) continue;
    if (isAcronymExplainedInline(fullText, token)) continue;
    unexplained.add(token);
  }

  if (unexplained.size > 0) {
    issues.push({
      code: 'UNEXPLAINED_ACRONYM_WARNING',
      severity: 'warning',
      field: 'glossary',
      message: `Unexplained acronym(s) detected without inline definition or glossary entry: ${Array.from(unexplained).join(', ')}. Explain on first use or add to glossary with a familiar anchor.`,
    });
  }
}
