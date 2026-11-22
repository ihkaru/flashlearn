<script lang="ts">
  import type { ErroneousExampleSpec } from '@flashlearn/shared';

  interface Props {
    example: ErroneousExampleSpec;
    alreadySolved: boolean;
    onSolved: () => void;
  }

  let { example, alreadySolved, onSolved }: Props = $props();

  let pickedStep = $state<number | null>(null);
  let stepFound = $state(false);
  let pickedFixId = $state<string | null>(null);

  const selectedFix = $derived(example.fixOptions.find((f) => f.id === pickedFixId) || null);

  function selectStep(stepNum: number) {
    pickedStep = stepNum;
    if (stepNum === example.flawedStepNumber) {
      stepFound = true;
    }
  }

  function selectFix(id: string) {
    pickedFixId = id;
    const opt = example.fixOptions.find((f) => f.id === id);
    if (opt?.isCorrect) {
      onSolved();
    }
  }
</script>

<div style="display: flex; flex-direction: column; gap: 14px;">
  <p style="margin: 0; font-size: 0.92rem; color: #334155; line-height: 1.55;">
    {example.scenarioPrompt}
  </p>

  <div style="display: flex; flex-direction: column; gap: 8px;">
    <div style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #0f766e;">
      1. Ketuk langkah yang keliru:
    </div>
    {#each example.steps as st (st.stepNumber)}
      {@const isSelected = pickedStep === st.stepNumber}
      {@const isTarget = st.stepNumber === example.flawedStepNumber}
      {@const isRightStep = isSelected && isTarget}
      {@const isWrongStep = isSelected && !isTarget}
      <button
        type="button"
        onclick={() => selectStep(st.stepNumber)}
        class="fl-btn-wrap"
        style="width: 100%; padding: 12px 14px; border-radius: 12px; text-align: left; border: 1.5px solid {isRightStep ? '#16a34a' : isWrongStep ? '#f59e0b' : '#cbd5e1'}; background: {isRightStep ? '#f0fdf4' : isWrongStep ? '#fffbeb' : '#ffffff'}; display: flex; flex-direction: column; gap: 4px;"
      >
        <span style="font-size: 0.76rem; font-weight: 800; color: #475569;">
          Langkah {st.stepNumber} · {st.label}
        </span>
        <span style="font-family: monospace; font-size: 0.88rem; color: #0f172a; line-height: 1.45;">
          {st.content}
        </span>
      </button>
    {/each}
  </div>

  {#if pickedStep !== null && !stepFound}
    <div style="border-radius: 10px; padding: 10px 14px; background: #fffbeb; border: 1px solid #fde68a; font-size: 0.86rem; color: #78350f;">
      Langkah {pickedStep} masih aman. Periksa lagi bagian perhitungan atau aturan intinya.
    </div>
  {/if}

  {#if stepFound || alreadySolved}
    <div style="display: flex; flex-direction: column; gap: 8px; padding-top: 4px;">
      <div style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #0f766e;">
        2. Langkah {example.flawedStepNumber} memang keliru. Pilih perbaikannya:
      </div>
      {#each example.fixOptions as fix (fix.id)}
        {@const isPicked = pickedFixId === fix.id}
        {@const isRight = isPicked && fix.isCorrect}
        {@const isWrong = isPicked && !fix.isCorrect}
        <button
          type="button"
          onclick={() => selectFix(fix.id)}
          class="fl-btn-wrap"
          style="width: 100%; min-height: 46px; padding: 11px 14px; border-radius: 11px; text-align: left; font-size: 0.88rem; font-weight: 600; border: 1.5px solid {isRight ? '#16a34a' : isWrong ? '#f59e0b' : '#cbd5e1'}; background: {isRight ? '#f0fdf4' : isWrong ? '#fffbeb' : '#ffffff'}; color: #0f172a;"
        >
          {fix.text}
        </button>
      {/each}
    </div>
  {/if}

  {#if selectedFix}
    <div style="border-radius: 12px; padding: 13px 15px; border: 1px solid {selectedFix.isCorrect ? '#86efac' : '#fde68a'}; background: {selectedFix.isCorrect ? '#f0fdf4' : '#fffbeb'}; font-size: 0.87rem; line-height: 1.5; color: {selectedFix.isCorrect ? '#14532d' : '#78350f'};">
      <p style="margin: 0;">{selectedFix.rationale}</p>
      {#if selectedFix.isCorrect && example.takeaway}
        <p style="margin: 8px 0 0 0; font-weight: 700;">Catatan kunci: {example.takeaway}</p>
      {/if}
    </div>
  {/if}
</div>
