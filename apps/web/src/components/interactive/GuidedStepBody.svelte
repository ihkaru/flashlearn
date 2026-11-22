<script lang="ts">
  import type {
    DiagnosticEvaluationResult,
    GuidedLearningStep,
    InteractiveModulePayload,
  } from '@flashlearn/shared';
  import AnchoringLabHost from './labs/AnchoringLabHost.svelte';
  import DiagnosticStressTestCard from './DiagnosticStressTestCard.svelte';

  interface Props {
    step: GuidedLearningStep;
    payload: InteractiveModulePayload;
    simHtml?: string | null;
    anchoringCompleted: boolean;
    stressTestSolved: boolean;
    thetaMastery: number;
    onAnchoringCompleted: () => void;
    onDiagnosticEvaluated: (res: DiagnosticEvaluationResult) => void;
  }

  let {
    step,
    payload,
    simHtml = null,
    anchoringCompleted,
    stressTestSolved,
    thetaMastery,
    onAnchoringCompleted,
    onDiagnosticEvaluated,
  }: Props = $props();

  const uila = $derived(payload.uila);
</script>

<div style="display: flex; flex-direction: column; gap: 16px;">
  {#if step.kind === 'anomaly'}
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

      <div style="background: #fffbeb; border-radius: 12px; padding: 15px 16px; border: 1px solid #fde68a;">
        <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #b45309; margin-bottom: 4px;">
          Titik Buntu
        </div>
        <p style="margin: 0; font-size: 0.94rem; color: #78350f; line-height: 1.6; font-weight: 500;">
          {uila.block1_anomaly.breakdownPoint}
        </p>
      </div>
    </div>

  {:else if step.kind === 'anchoring_lab' && uila.block2_grounding.anchoringLab}
    <AnchoringLabHost
      lab={uila.block2_grounding.anchoringLab}
      {simHtml}
      completed={anchoringCompleted}
      onAhaReached={onAnchoringCompleted}
    />

  {:else if step.kind === 'bridging'}
    <div style="display: flex; flex-direction: column; gap: 14px;">
      {#if uila.block2_grounding.physicalObject}
        <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 15px 16px;">
          <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #0f766e; margin-bottom: 4px;">
            Gambaran Akrab
          </div>
          <p style="margin: 0; font-size: 0.94rem; color: #134e4a; line-height: 1.55;">
            {uila.block2_grounding.physicalObject}
          </p>
          {#if uila.block2_grounding.isomorphicMapping}
            <p style="margin: 8px 0 0 0; font-size: 0.88rem; color: #334155; line-height: 1.55;">
              {uila.block2_grounding.isomorphicMapping}
            </p>
          {/if}
        </div>
      {/if}

      {#if uila.block2_grounding.bridgingChain}
        {#each uila.block2_grounding.bridgingChain as bridge}
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px 16px;">
            <h4 style="margin: 0 0 6px 0; font-size: 0.96rem; font-weight: 800; color: #0f172a;">
              {bridge.stepTitle}
            </h4>
            <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: #334155; line-height: 1.55;">
              {bridge.bridgeScenario}
            </p>
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
              <div style="font-size: 0.86rem; color: #9f1239; line-height: 1.45;">
                <strong>Sering keliru:</strong> {cc.beginnerMisconception}
              </div>
              <div style="font-size: 0.88rem; color: #166534; line-height: 1.45;">
                <strong>Yang sebenarnya terjadi:</strong> {cc.physicalReality}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

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

  {:else if step.kind === 'stress_test'}
    <DiagnosticStressTestCard
      probe={uila.block5_stressTest}
      currentTheta={thetaMastery}
      alreadySolved={stressTestSolved}
      onEvaluated={onDiagnosticEvaluated}
    />

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
</div>
