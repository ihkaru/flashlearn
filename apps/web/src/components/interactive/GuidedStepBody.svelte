<script lang="ts">
  import type {
    DiagnosticEvaluationResult,
    GuidedLearningStep,
    InteractiveModulePayload,
  } from '@flashlearn/shared';
  import AnchoringLabHost from './labs/AnchoringLabHost.svelte';
  import DiagnosticStressTestCard from './DiagnosticStressTestCard.svelte';
  import HingeCheckpointCard from './HingeCheckpointCard.svelte';
  import ErroneousExampleCard from './ErroneousExampleCard.svelte';
  import IllStructuredCaseCard from './IllStructuredCaseCard.svelte';
  import ExplainBackCard from './ExplainBackCard.svelte';
  import ModuleFigureStrip from './ModuleFigureStrip.svelte';

  interface Props {
    step: GuidedLearningStep;
    payload: InteractiveModulePayload;
    simHtml?: string | null;
    anchoringCompleted: boolean;
    stressTestSolved: boolean;
    stepCompleted: boolean;
    thetaMastery: number;
    onAnchoringCompleted: () => void;
    onDiagnosticEvaluated: (res: DiagnosticEvaluationResult) => void;
    onStepInteractionSolved: (stepId: string) => void;
  }

  let {
    step,
    payload,
    simHtml = null,
    anchoringCompleted,
    stressTestSolved,
    stepCompleted,
    thetaMastery,
    onAnchoringCompleted,
    onDiagnosticEvaluated,
    onStepInteractionSolved,
  }: Props = $props();

  const uila = $derived(payload.uila);
  let quickGuessPicked = $state<string | null>(null);

  const activeLab = $derived.by(() => {
    const idx = step.itemIndex ?? 0;
    if (idx === 0) return uila.block2_grounding.anchoringLab || null;
    return payload.additionalAnchoringLabs?.[idx - 1] || null;
  });

  const activeHinge = $derived.by(() => {
    const idx = step.itemIndex ?? 0;
    if (idx === 0) return payload.hingeCheck || null;
    return payload.additionalHingeChecks?.[idx - 1] || null;
  });

  const activeErroneous = $derived.by(() => {
    const idx = step.itemIndex ?? 0;
    if (idx === 0) return payload.erroneousExample || null;
    return payload.additionalErroneousExamples?.[idx - 1] || null;
  });

  const activeStressTest = $derived.by(() => {
    const idx = step.itemIndex ?? 0;
    if (idx === 0) return uila.block5_stressTest;
    return payload.additionalStressTests?.[idx - 1] || uila.block5_stressTest;
  });
</script>

<div style="display: flex; flex-direction: column; gap: 16px;">
  {#if step.kind === 'micro_core' && payload.microKnow}
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="background: #f0fdfa; border-left: 4px solid #0f766e; border-radius: 0 12px 12px 0; padding: 16px;">
        <p style="margin: 0; font-size: 0.98rem; font-weight: 700; color: #134e4a; line-height: 1.6;">
          {payload.microKnow.coreIdea}
        </p>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;">
        <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; margin-bottom: 4px;">
          Kenapa Penting
        </div>
        <p style="margin: 0; font-size: 0.92rem; color: #334155; line-height: 1.55;">
          {payload.microKnow.whyItMatters}
        </p>
      </div>
    </div>

  {:else if step.kind === 'micro_examples' && payload.microKnow}
    <div style="display: flex; flex-direction: column; gap: 10px;">
      {#each payload.microKnow.concreteExamples as ex}
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;">
          <div style="font-size: 0.9rem; font-weight: 800; color: #0f766e; margin-bottom: 4px;">{ex.label}</div>
          <p style="margin: 0; font-size: 0.9rem; color: #334155; line-height: 1.55;">{ex.detail}</p>
        </div>
      {/each}
      {#if payload.microKnow.keyTakeaways.length > 0}
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 13px 16px;">
          <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; margin-bottom: 6px;">
            Ringkasan Cepat
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 0.88rem; color: #0f172a; line-height: 1.55;">
            {#each payload.microKnow.keyTakeaways as item}
              <li>{item}</li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>

  {:else if step.kind === 'anomaly'}
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="background: #f8fafc; border-radius: 12px; padding: 15px 16px; border: 1px solid #e2e8f0;">
        <div style="font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; margin-bottom: 4px;">
          Situasi Awal
        </div>
        <p style="margin: 0; font-size: 0.94rem; color: #0f172a; line-height: 1.6;">
          {uila.block1_anomaly.groundState}
        </p>
      </div>

      <div style="background: #ffffff; border-radius: 12px; padding: 15px 16px; border: 1px solid #e2e8f0;">
        <div style="font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; margin-bottom: 4px;">
          Cara Biasa
        </div>
        <p style="margin: 0; font-size: 0.93rem; color: #334155; line-height: 1.6;">
          {uila.block1_anomaly.oldWay}
        </p>
      </div>

      {#if uila.block1_anomaly.quickPrediction && quickGuessPicked === null}
        <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #0f766e;">
            Tebak Cepat (10 Detik)
          </div>
          <p style="margin: 0; font-size: 0.9rem; font-weight: 700; color: #134e4a; line-height: 1.5;">
            {uila.block1_anomaly.quickPrediction.prompt}
          </p>
          {#each uila.block1_anomaly.quickPrediction.options as opt (opt.id)}
            <button
              type="button"
              onclick={() => (quickGuessPicked = opt.id)}
              class="fl-btn-wrap"
              style="width: 100%; padding: 10px 13px; border-radius: 10px; text-align: left; font-size: 0.87rem; font-weight: 600; background: #ffffff; border: 1px solid #5eead4; color: #0f172a;"
            >
              {opt.text}
            </button>
          {/each}
        </div>
      {:else}
        <div style="background: #fffbeb; border-radius: 12px; padding: 15px 16px; border: 1px solid #fde68a;">
          <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #b45309; margin-bottom: 4px;">
            Titik Buntu
          </div>
          <p style="margin: 0; font-size: 0.94rem; color: #78350f; line-height: 1.6; font-weight: 500;">
            {uila.block1_anomaly.breakdownPoint}
          </p>
          {#if uila.block1_anomaly.quickPrediction && quickGuessPicked !== null}
            <p style="margin: 8px 0 0 0; font-size: 0.85rem; color: #92400e; line-height: 1.5;">
              {uila.block1_anomaly.quickPrediction.revealsMisconception}
            </p>
          {/if}
        </div>
      {/if}
    </div>

  {:else if step.kind === 'anchoring_lab' && activeLab}
    {#key step.id}
      <AnchoringLabHost
        lab={activeLab}
        {simHtml}
        completed={stepCompleted || (step.id === 'step-anchoring' && anchoringCompleted)}
        onAhaReached={onAnchoringCompleted}
      />
    {/key}

  {:else if step.kind === 'bridging'}
    <div style="display: flex; flex-direction: column; gap: 14px;">
      {#if uila.block2_grounding.physicalObject}
        <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 15px 16px;">
          <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #0f766e; margin-bottom: 4px;">
            Gambaran Akrab
          </div>
          <p style="margin: 0; font-size: 0.94rem; color: #134e4a; line-height: 1.55;">{uila.block2_grounding.physicalObject}</p>
          {#if uila.block2_grounding.isomorphicMapping}
            <p style="margin: 8px 0 0 0; font-size: 0.88rem; color: #334155; line-height: 1.55;">{uila.block2_grounding.isomorphicMapping}</p>
          {/if}
        </div>
      {/if}

      {#if uila.block2_grounding.bridgingChain}
        {#each uila.block2_grounding.bridgingChain as bridge}
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px 16px;">
            <h4 style="margin: 0 0 6px 0; font-size: 0.96rem; font-weight: 800; color: #0f172a;">{bridge.stepTitle}</h4>
            <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: #334155; line-height: 1.55;">{bridge.bridgeScenario}</p>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              {#each bridge.structuralMapping as row}
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 0.86rem; line-height: 1.45;">
                  <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">
                    {row.anchorElement} <span style="color: #0f766e;">-&gt; {row.targetConcept}</span>
                  </div>
                  <div style="color: #475569;">{row.whyItMatches}</div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      {/if}

      {#if uila.block2_grounding.analogyBreakpoint}
        <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 14px 16px;">
          <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #be123c; margin-bottom: 4px;">
            Batas Analogi (Penting)
          </div>
          <p style="margin: 0 0 6px 0; font-size: 0.88rem; color: #881337; line-height: 1.5;">
            {uila.block2_grounding.analogyBreakpoint.whereItBreaks}
          </p>
          <p style="margin: 0; font-size: 0.86rem; color: #4c0519; line-height: 1.5;">
            <strong>Mekanisme nyatanya:</strong> {uila.block2_grounding.analogyBreakpoint.realMechanismInstead}
          </p>
        </div>
      {/if}
    </div>

  {:else if step.kind === 'thought_experiment'}
    <div style="display: flex; flex-direction: column; gap: 10px;">
      {#each uila.block2_grounding.thoughtExperimentSteps || [] as line, idx}
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start;">
          <span style="width: 26px; height: 26px; border-radius: 8px; background: #f0fdfa; color: #0f766e; font-size: 0.82rem; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
            {idx + 1}
          </span>
          <p style="margin: 0; font-size: 0.92rem; color: #1e293b; line-height: 1.55;">{line}</p>
        </div>
      {/each}
    </div>

  {:else if step.kind === 'hinge_check' && activeHinge}
    {#key step.id}
      <HingeCheckpointCard
        check={activeHinge}
        alreadySolved={stepCompleted}
        onSolved={() => onStepInteractionSolved(step.id)}
      />
    {/key}

  {:else if step.kind === 'mechanics'}
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div style="background: #f0fdfa; border-left: 4px solid #0f766e; border-radius: 0 12px 12px 0; padding: 14px 16px;">
        <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #0f766e; margin-bottom: 4px;">
          Aturan Inti yang Selalu Berlaku
        </div>
        <p style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #134e4a; line-height: 1.55;">
          {uila.block3_coreMechanics.invariantProperty}
        </p>
      </div>

      {#if uila.block3_coreMechanics.contrastingCases.length > 0}
        <div style="display: flex; flex-direction: column; gap: 10px;">
          {#each uila.block3_coreMechanics.contrastingCases as cc}
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;">
              <div style="font-size: 0.86rem; color: #9f1239; line-height: 1.45;"><strong>Sering keliru:</strong> {cc.beginnerMisconception}</div>
              <div style="font-size: 0.88rem; color: #166534; line-height: 1.45;"><strong>Yang sebenarnya terjadi:</strong> {cc.physicalReality}</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

  {:else if step.kind === 'ill_structured_case' && payload.illStructuredCase}
    <IllStructuredCaseCard caseSpec={payload.illStructuredCase} />

  {:else if step.kind === 'notation'}
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div style="background: #0f172a; color: #f8fafc; border-radius: 12px; padding: 16px; font-family: monospace; font-size: 0.96rem; line-height: 1.6; overflow-x: auto;">
        {uila.block4_notationContract.formulaOrCode}
      </div>
      <p style="margin: 0; font-size: 0.92rem; color: #334155; line-height: 1.6;">
        {uila.block4_notationContract.minimalFormalization}
      </p>
      {#if uila.block4_notationContract.termsDeconstruction.length > 0}
        <div style="display: flex; flex-direction: column; gap: 8px;">
          {#each uila.block4_notationContract.termsDeconstruction as item}
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; font-size: 0.88rem; line-height: 1.45;">
              <code style="font-weight: 800; color: #0f766e; background: #ccfbf1; padding: 2px 6px; border-radius: 5px; margin-right: 8px;">
                {item.symbol}
              </code>
              <span style="color: #1e293b;">{item.physicalMeaning}</span>
            </div>
          {/each}
        </div>
      {/if}
      {#if uila.block4_notationContract.workedExampleSummary}
        <div style="background: #f8fafc; border-left: 3px solid #0f766e; border-radius: 0 10px 10px 0; padding: 12px 14px; font-size: 0.88rem; color: #334155; line-height: 1.55;">
          <strong>Contoh Singkat:</strong> {uila.block4_notationContract.workedExampleSummary}
        </div>
      {/if}
    </div>

  {:else if step.kind === 'erroneous_example' && activeErroneous}
    {#key step.id}
      <ErroneousExampleCard
        example={activeErroneous}
        alreadySolved={stepCompleted}
        onSolved={() => onStepInteractionSolved(step.id)}
      />
    {/key}

  {:else if step.kind === 'stress_test'}
    {#key step.id}
      <DiagnosticStressTestCard
        probe={activeStressTest}
        currentTheta={thetaMastery}
        alreadySolved={stepCompleted || (step.id === 'step-stress-test' && stressTestSolved)}
        onEvaluated={onDiagnosticEvaluated}
      />
    {/key}

  {:else if step.kind === 'explain_back' && payload.explainBack}
    {#key step.id}
      <ExplainBackCard
        spec={payload.explainBack}
        alreadySolved={stepCompleted}
        onSolved={() => onStepInteractionSolved(step.id)}
      />
    {/key}

  {:else if step.kind === 'summary'}
    <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 10px;">
      <div style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #15803d;">
        Modul Selesai
      </div>
      <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #14532d;">
        Pemahaman Inti Tersimpan
      </h3>
      <p style="margin: 0; font-size: 0.92rem; color: #166534; line-height: 1.55;">
        {payload.learningObjective}
      </p>
      <div style="font-size: 0.84rem; font-weight: 700; color: #15803d; margin-top: 4px;">
        Tingkat penguasaan saat ini: {Math.round(thetaMastery * 100)}%
      </div>
    </div>
  {/if}

  <ModuleFigureStrip {payload} {step} />
</div>
