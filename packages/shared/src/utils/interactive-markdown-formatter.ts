import type { Content, InteractiveModulePayload } from '../types';

export interface MarkdownExportOptions {
  /** Optional origin (e.g. "https://learn.dvlpid.my.id") to resolve relative /api/v1/assets/ URLs */
  assetOrigin?: string;
}

function resolveUrl(url: string, origin?: string): string {
  if (!url) return '';
  if (url.startsWith('/api/') && origin) {
    return `${origin.replace(/\/$/, '')}${url}`;
  }
  return url;
}

function pushSection(lines: string[], heading: string, content: string[]): void {
  const nonEmpty = content.filter((line) => line.trim().length > 0);
  if (nonEmpty.length === 0) return;
  lines.push(heading, '', ...nonEmpty, '');
}

/**
 * Formats a UILA-v2 interactive_module payload into clean, lossless Markdown
 * optimized for pasting directly into any AI chat assistant.
 */
export function formatInteractiveModuleToMarkdown(
  content: Content,
  payload: InteractiveModulePayload,
  options: MarkdownExportOptions = {}
): string {
  const lines: string[] = [];
  const profile = payload.knowledgeProfile || 'bridging_understand';
  const mins = content.readingTimeMinutes || payload.estimatedMinutes || 5;

  lines.push(`- **Tipe**: Panduan Interaktif (\`${profile}\`) · Estimasi ${mins} menit`);
  if (payload.learningObjective?.trim()) {
    lines.push(`- **Tujuan Belajar**: ${payload.learningObjective.trim()}`);
  }
  if (content.summary?.trim() && content.summary.trim() !== payload.learningObjective?.trim()) {
    lines.push(`- **Ringkasan**: ${content.summary.trim()}`);
  }
  lines.push('');

  if (payload.microKnow) {
    const mk = payload.microKnow;
    const mkLines: string[] = [];
    if (mk.coreIdea?.trim()) mkLines.push(`**Gagasan Inti**: ${mk.coreIdea.trim()}`);
    if (mk.whyItMatters?.trim()) mkLines.push(`**Kenapa Penting**: ${mk.whyItMatters.trim()}`);
    if (mk.concreteExamples?.length) {
      mkLines.push('', '**Contoh Nyata**:');
      for (const ex of mk.concreteExamples) {
        mkLines.push(`- **${ex.label}**: ${ex.detail}`);
      }
    }
    if (mk.keyTakeaways?.length) {
      mkLines.push('', '**Ringkasan Cepat**:');
      for (const item of mk.keyTakeaways) mkLines.push(`- ${item}`);
    }
    pushSection(lines, '#### Konsep Inti & Contoh', mkLines);
  }

  const u = payload.uila;
  if (u) {
    // Block 1: Anomaly
    const b1 = u.block1_anomaly;
    if (b1 && (b1.groundState || b1.oldWay || b1.breakdownPoint)) {
      const b1Lines: string[] = [];
      if (b1.groundState?.trim()) b1Lines.push(`- **Situasi Awal**: ${b1.groundState.trim()}`);
      if (b1.oldWay?.trim()) b1Lines.push(`- **Cara Biasa**: ${b1.oldWay.trim()}`);
      if (b1.breakdownPoint?.trim()) b1Lines.push(`- **Titik Buntu**: ${b1.breakdownPoint.trim()}`);
      if (b1.quickPrediction?.prompt) {
        b1Lines.push(`- **Tebak Cepat**: ${b1.quickPrediction.prompt}`);
        if (b1.quickPrediction.revealsMisconception) {
          b1Lines.push(`  - *Penyingkap Miskonsepsi*: ${b1.quickPrediction.revealsMisconception}`);
        }
      }
      pushSection(lines, '#### 1. Masalah Nyata (Anomali)', b1Lines);
    }

    // Block 2: Grounding & Bridging
    const b2 = u.block2_grounding;
    const allLabs = [
      ...(b2?.anchoringLab ? [b2.anchoringLab] : []),
      ...(payload.additionalAnchoringLabs || []),
    ];
    if (
      b2 &&
      (b2.physicalObject ||
        b2.isomorphicMapping ||
        b2.bridgingChain?.length ||
        b2.thoughtExperimentSteps?.length ||
        b2.analogyBreakpoint?.whereItBreaks ||
        allLabs.length > 0)
    ) {
      const b2Lines: string[] = [];
      if (b2.physicalObject?.trim()) b2Lines.push(`- **Gambaran Akrab**: ${b2.physicalObject.trim()}`);
      if (b2.isomorphicMapping?.trim()) b2Lines.push(`- **Pemetaan Mekanisme**: ${b2.isomorphicMapping.trim()}`);
      for (const lab of allLabs) {
        b2Lines.push(`- **Simulasi Interaktif — ${lab.title}**: ${lab.instructionPrompt}`);
        if (lab.ahaObservation?.trim()) {
          b2Lines.push(`  - *Temuan Inti (Aha!)*: ${lab.ahaObservation.trim()}`);
        }
      }
      if (b2.thoughtExperimentSteps?.length) {
        b2Lines.push('', '**Eksperimen Pikiran**:');
        b2.thoughtExperimentSteps.forEach((step, idx) => b2Lines.push(`${idx + 1}. ${step}`));
      }
      if (b2.bridgingChain?.length) {
        for (const bridge of b2.bridgingChain) {
          b2Lines.push('', `**Jembatan: ${bridge.stepTitle}**`, bridge.bridgeScenario);
          for (const row of bridge.structuralMapping || []) {
            b2Lines.push(`- \`${row.anchorElement}\` -> **${row.targetConcept}**: ${row.whyItMatches}`);
          }
        }
      }
      if (b2.analogyBreakpoint?.whereItBreaks?.trim()) {
        b2Lines.push(
          '',
          `- **Batas Analogi**: ${b2.analogyBreakpoint.whereItBreaks.trim()}`,
          `- **Mekanisme Nyatanya**: ${b2.analogyBreakpoint.realMechanismInstead.trim()}`
        );
      }
      if (b2.mermaidDiagram?.trim()) {
        b2Lines.push('', '```mermaid', b2.mermaidDiagram.trim(), '```');
      }
      pushSection(lines, '#### 2. Gambaran Intuitif & Jembatan Konsep', b2Lines);
    }

    // Block 3: Core Mechanics
    const b3 = u.block3_coreMechanics;
    if (b3 && (b3.invariantProperty || b3.contrastingCases?.length || b3.variableComponents?.length)) {
      const b3Lines: string[] = [];
      if (b3.invariantProperty?.trim()) {
        b3Lines.push(`> **Aturan Inti (Invarian)**: ${b3.invariantProperty.trim()}`);
      }
      if (b3.variableComponents?.length) {
        b3Lines.push(`- **Komponen Variabel**: ${b3.variableComponents.join(', ')}`);
      }
      if (b3.contrastingCases?.length) {
        b3Lines.push('', '**Jebakan Umum vs Realitas Nyata**:');
        for (const cc of b3.contrastingCases) {
          b3Lines.push(`- *Sering keliru*: ${cc.beginnerMisconception}`);
          b3Lines.push(`  *Yang sebenarnya*: ${cc.physicalReality}`);
        }
      }
      if (b3.mermaidDiagram?.trim()) {
        b3Lines.push('', '```mermaid', b3.mermaidDiagram.trim(), '```');
      }
      pushSection(lines, '#### 3. Aturan Inti & Jebakan Umum', b3Lines);
    }

    // Block 4: Notation Contract
    const b4 = u.block4_notationContract;
    if (b4 && (b4.formulaOrCode || b4.minimalFormalization || b4.termsDeconstruction?.length || b4.workedExampleSummary)) {
      const b4Lines: string[] = [];
      if (b4.formulaOrCode?.trim()) {
        b4Lines.push('```text', b4.formulaOrCode.trim(), '```');
      }
      if (b4.minimalFormalization?.trim()) b4Lines.push(b4.minimalFormalization.trim());
      if (b4.termsDeconstruction?.length) {
        b4Lines.push('', '**Bedah Simbol**:');
        for (const term of b4.termsDeconstruction) {
          b4Lines.push(`- \`${term.symbol}\`: ${term.physicalMeaning}`);
        }
      }
      if (b4.workedExampleSummary?.trim()) {
        b4Lines.push('', `**Contoh Terbedah**: ${b4.workedExampleSummary.trim()}`);
      }
      pushSection(lines, '#### 4. Ringkasan Rumus, Simbol & Contoh', b4Lines);
    }
  }

  // Ill-Structured Case
  if (payload.illStructuredCase) {
    const ic = payload.illStructuredCase;
    const icLines: string[] = [
      `**${ic.dilemmaTitle}**`,
      ic.contextBrief,
      '',
      '**Sudut Pandang & Bukti**:',
    ];
    for (const p of ic.perspectives || []) {
      icLines.push(`- **${p.actorOrSchool}**: ${p.claim}`);
      icLines.push(`  - *Bukti pendukung*: ${p.supportingEvidence}`);
      icLines.push(`  - *Titik buta*: ${p.blindSpot}`);
    }
    if (ic.corroborationQuestion) {
      icLines.push('', `**Pertanyaan Evaluasi**: ${ic.corroborationQuestion}`);
    }
    if (ic.rubricCriteria?.length) {
      icLines.push('', '**Kriteria Rubrik**:');
      for (const r of ic.rubricCriteria) {
        icLines.push(`- **${r.criterion}** — Kuat: ${r.strongIndicator} | Lemah: ${r.weakIndicator}`);
      }
    }
    pushSection(lines, '#### Studi Kasus & Silang Sudut Pandang', icLines);
  }

  // Hinge Checks (1..N)
  const hinges = [
    ...(payload.hingeCheck ? [payload.hingeCheck] : []),
    ...(payload.additionalHingeChecks || []),
  ];
  if (hinges.length > 0) {
    const hLines: string[] = [];
    hinges.forEach((hc, idx) => {
      hLines.push(`**Cek ${idx + 1}**: ${hc.prompt}`);
      for (const opt of hc.options || []) {
        const mark = opt.isCorrect ? '[Benar]' : '[Keliru]';
        hLines.push(`- ${mark} ${opt.text} — *${opt.feedback}*`);
      }
      if (hc.remediationCard?.trim()) {
        hLines.push(`- *Catatan inti*: ${hc.remediationCard.trim()}`);
      }
      hLines.push('');
    });
    pushSection(lines, '#### Cek Pemahaman Tengah Jalan', hLines);
  }

  // Erroneous Examples (1..N)
  const errExamples = [
    ...(payload.erroneousExample ? [payload.erroneousExample] : []),
    ...(payload.additionalErroneousExamples || []),
  ];
  if (errExamples.length > 0) {
    const eLines: string[] = [];
    errExamples.forEach((ex, idx) => {
      eLines.push(`**Latihan Deteksi Kesalahan ${idx + 1}: ${ex.title}**`, ex.scenarioPrompt);
      for (const st of ex.steps || []) {
        const tag = st.stepNumber === ex.flawedStepNumber ? ' *(KELIRU)*' : '';
        eLines.push(`${st.stepNumber}. **${st.label}**${tag}: \`${st.content}\``);
      }
      const fix = (ex.fixOptions || []).find((f) => f.isCorrect);
      if (fix) eLines.push(`- **Perbaikan Benar**: ${fix.text} — *${fix.rationale}*`);
      if (ex.takeaway?.trim()) eLines.push(`- **Pelajaran Utama**: ${ex.takeaway.trim()}`);
      eLines.push('');
    });
    pushSection(lines, '#### Analisis & Perbaikan Kesalahan', eLines);
  }

  // Stress Tests (1..N)
  const stressTests = [
    ...(u?.block5_stressTest ? [u.block5_stressTest] : []),
    ...(payload.additionalStressTests || []),
  ];
  if (stressTests.length > 0) {
    const sLines: string[] = [];
    stressTests.forEach((st, idx) => {
      sLines.push(`**Uji ${idx + 1}**: ${st.prompt}`);
      for (const opt of st.options || []) {
        const mark = opt.isCorrect ? '[Benar]' : '[Distraktor]';
        sLines.push(`- ${mark} ${opt.text} — *${opt.causalRationale}*`);
      }
      if (st.groundTruth?.trim()) sLines.push(`- **Kunci Inti**: ${st.groundTruth.trim()}`);
      sLines.push('');
    });
    pushSection(lines, '#### Uji Pemahaman & Transfer Konsep', sLines);
  }

  // Explain-Back
  if (payload.explainBack) {
    const eb = payload.explainBack;
    const ebLines: string[] = [`**Pertanyaan Refleksi**: ${eb.prompt}`];
    if (eb.referenceKeyPoints?.length) {
      ebLines.push('**Poin Kunci Sebab-Akibat**:');
      for (const pt of eb.referenceKeyPoints) ebLines.push(`- ${pt}`);
    }
    pushSection(lines, '#### Jelaskan Balik (Self-Explanation)', ebLines);
  }

  // Figures & Annotations
  if (payload.figures?.length) {
    const fLines: string[] = [];
    for (const fig of payload.figures) {
      const pageTag = fig.sourcePage ? ` (Hal. ${fig.sourcePage})` : '';
      const url = resolveUrl(fig.assetUrl, options.assetOrigin);
      fLines.push(`- **${fig.caption}**${pageTag}`);
      if (fig.altText?.trim()) fLines.push(`  - *Deskripsi visual*: ${fig.altText.trim()}`);
      if (url) fLines.push(`  - *Tautan gambar*: ${url}`);
      for (const note of fig.annotations || []) {
        fLines.push(`  - *${note.label}*: ${note.explanation}`);
      }
    }
    pushSection(lines, '#### Ilustrasi & Diagram Sumber', fLines);
  }

  // Slide Speaker Notes
  if (payload.slideNotes?.length) {
    const nLines: string[] = [];
    for (const note of payload.slideNotes) {
      nLines.push(`- **Slide ${note.index + 1} — ${note.title}**${note.purpose ? `: ${note.purpose}` : ''}`);
      for (const bullet of note.talk || []) {
        nLines.push(`  - ${bullet}`);
      }
    }
    pushSection(lines, '#### Ringkasan Slide Visual', nLines);
  }

  // Glossary
  if (payload.glossary?.length) {
    const gLines: string[] = [];
    for (const g of payload.glossary) {
      const anchor = g.highSchoolAnchor ? ` *(Padanan sederhana: ${g.highSchoolAnchor})*` : '';
      gLines.push(`- **${g.term}**: ${g.definition}${anchor}`);
    }
    pushSection(lines, '#### Istilah Kunci Modul', gLines);
  }

  // Source Citations
  if (payload.sourceCitations?.length) {
    const cLines: string[] = [];
    for (const cit of payload.sourceCitations) {
      const quote = cit.verbatimQuote ? ` — "${cit.verbatimQuote}"` : '';
      cLines.push(`- **${cit.sourceRef}** (${cit.locationTag})${quote}`);
    }
    pushSection(lines, '#### Rujukan Sumber', cLines);
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
