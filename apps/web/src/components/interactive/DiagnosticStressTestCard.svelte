<script lang="ts">
  import {
    evaluateDiagnosticChoice,
    type ConfidenceLevel,
    type DiagnosticEvaluationResult,
    type UilaStressTestBlock,
  } from '@flashlearn/shared';

  interface Props {
    probe: UilaStressTestBlock;
    currentTheta: number;
    alreadySolved: boolean;
    onEvaluated: (result: DiagnosticEvaluationResult) => void;
  }

  let { probe, currentTheta, alreadySolved, onEvaluated }: Props = $props();

  let confidence = $state<ConfidenceLevel>('unsure');
  let selectedId = $state<string | null>(null);
  let lastResult = $state<DiagnosticEvaluationResult | null>(null);
  let hintLevel = $state(0);

  const CONFIDENCE_CHIPS: Array<{ value: ConfidenceLevel; label: string }> = [
    { value: 'sure', label: 'Yakin' },
    { value: 'unsure', label: 'Ragu' },
    { value: 'guessing', label: 'Menebak' },
  ];

  const hintSequence = $derived([
    probe.hintLadder.level0Reflective,
    probe.hintLadder.level1Directional,
    probe.hintLadder.level2Constraint,
    probe.hintLadder.level3WorkedExample,
  ].filter(Boolean));

  function submitChoice(optionId: string) {
    selectedId = optionId;
    const result = evaluateDiagnosticChoice(probe, optionId, currentTheta, 0.35, confidence);
    lastResult = result;
    if (!result.isCorrect && hintLevel === 0) {
      hintLevel = 1;
    }
    onEvaluated(result);
  }

  function showNextHint() {
    if (hintLevel < hintSequence.length) {
      hintLevel += 1;
    }
  }
</script>

<div style="display: flex; flex-direction: column; gap: 14px;">
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
    <p style="margin: 0; font-size: 0.98rem; font-weight: 700; color: #0f172a; line-height: 1.55;">
      {probe.prompt}
    </p>
  </div>

  <!-- Calm Confidence Calibration selector (3 compact chips) -->
  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
    <span style="font-size: 0.78rem; font-weight: 700; color: #475569;">Seberapa yakin?</span>
    <div style="display: flex; gap: 6px;">
      {#each CONFIDENCE_CHIPS as chip (chip.value)}
        <button
          type="button"
          onclick={() => (confidence = chip.value)}
          class="fl-btn fl-btn-sm"
          style="padding: 5px 11px; font-size: 0.78rem; border-radius: 999px; font-weight: 700; border: 1px solid {confidence === chip.value ? '#0f766e' : '#cbd5e1'}; background: {confidence === chip.value ? '#0f766e' : '#ffffff'}; color: {confidence === chip.value ? '#ffffff' : '#475569'};"
        >
          {chip.label}
        </button>
      {/each}
    </div>
  </div>

  <div style="display: flex; flex-direction: column; gap: 10px;">
    {#each probe.options as opt (opt.optionId)}
      {@const isPicked = selectedId === opt.optionId}
      {@const isSuccess = isPicked && lastResult?.isCorrect}
      {@const isRetry = isPicked && lastResult && !lastResult.isCorrect}
      <button
        type="button"
        onclick={() => submitChoice(opt.optionId)}
        class="fl-btn-wrap"
        style="width: 100%; min-height: 52px; padding: 13px 16px; border-radius: 12px; text-align: left; font-size: 0.92rem; line-height: 1.45; font-weight: 600; border: 1.5px solid {isSuccess ? '#16a34a' : isRetry ? '#f59e0b' : isPicked ? '#0f766e' : '#cbd5e1'}; background: {isSuccess ? '#f0fdf4' : isRetry ? '#fffbeb' : '#ffffff'}; color: #0f172a;"
      >
        {opt.text}
      </button>
    {/each}
  </div>

  {#if lastResult}
    {#key `${selectedId}-${lastResult.isCorrect}`}
      <div
        class={lastResult.isCorrect ? 'fl-feedback-correct' : 'fl-feedback-nudge'}
        style="border-radius: 12px; padding: 14px 16px; border: 1px solid {lastResult.isCorrect ? '#86efac' : '#fde68a'}; background: {lastResult.isCorrect ? '#f0fdf4' : '#fffbeb'};"
      >
      <div style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: {lastResult.isCorrect ? '#15803d' : '#92400e'}; margin-bottom: 4px;">
        {lastResult.isCorrect ? 'Tepat sekali' : 'Belum tepat, coba cek lagi'}
      </div>
      <p style="margin: 0; font-size: 0.88rem; color: {lastResult.isCorrect ? '#14532d' : '#78350f'}; line-height: 1.5;">
        {lastResult.selectedOption.causalRationale}
      </p>

      {#if lastResult.calibrationNote}
        <p style="margin: 8px 0 0 0; font-size: 0.82rem; color: {lastResult.requiresConsolidation ? '#9f1239' : '#334155'}; font-weight: 600; line-height: 1.45;">
          {lastResult.calibrationNote}
        </p>
      {/if}

      {#if !lastResult.isCorrect && hintLevel > 0 && hintSequence[hintLevel - 1]}
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #fde68a; font-size: 0.85rem; color: #78350f; line-height: 1.5;">
          <strong>Petunjuk {hintLevel}/{hintSequence.length}:</strong> {hintSequence[hintLevel - 1]}
        </div>
        {#if hintLevel < hintSequence.length}
          <button
            type="button"
            onclick={showNextHint}
            class="fl-btn fl-btn-sm"
            style="margin-top: 8px; background: #ffffff; color: #92400e; border: 1px solid #fcd34d; font-size: 0.78rem;"
          >
            Minta petunjuk lebih jelas
          </button>
        {/if}
      {/if}
      </div>
    {/key}
  {:else if alreadySolved}
    <div style="border-radius: 10px; padding: 10px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; font-size: 0.84rem; color: #166534; font-weight: 600;">
      Kamu sudah menjawab tepat sebelumnya. Kamu bisa langsung lanjut atau mencoba ulang.
    </div>
  {/if}
</div>
