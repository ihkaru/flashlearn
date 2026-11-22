<script lang="ts">
  import type { ExplainBackSpec } from '@flashlearn/shared';

  interface Props {
    spec: ExplainBackSpec;
    alreadySolved: boolean;
    onSolved: () => void;
  }

  let { spec, alreadySolved, onSolved }: Props = $props();

  let pickedChoiceId = $state<string | null>(null);
  let learnerNote = $state('');
  let revealedPoints = $state(false);

  const selectedChoice = $derived(spec.choices?.find((c) => c.id === pickedChoiceId) || null);

  function choose(id: string) {
    pickedChoiceId = id;
    const item = spec.choices?.find((c) => c.id === id);
    if (item?.isStrong) {
      onSolved();
    }
  }

  function submitSelfExplanation() {
    if (learnerNote.trim().length < 10) return;
    revealedPoints = true;
    onSolved();
  }
</script>

<div style="display: flex; flex-direction: column; gap: 14px;">
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px 16px;">
    <p style="margin: 0; font-size: 0.95rem; font-weight: 700; color: #0f172a; line-height: 1.55;">
      {spec.prompt}
    </p>
  </div>

  {#if spec.mode === 'select_causal_explanation' && spec.choices}
    <div style="display: flex; flex-direction: column; gap: 9px;">
      {#each spec.choices as ch (ch.id)}
        {@const isPicked = pickedChoiceId === ch.id}
        {@const isRight = isPicked && ch.isStrong}
        {@const isWrong = isPicked && !ch.isStrong}
        <button
          type="button"
          onclick={() => choose(ch.id)}
          class="fl-btn-wrap"
          style="width: 100%; min-height: 48px; padding: 12px 15px; border-radius: 12px; text-align: left; font-size: 0.9rem; font-weight: 600; line-height: 1.45; border: 1.5px solid {isRight ? '#16a34a' : isWrong ? '#f59e0b' : '#cbd5e1'}; background: {isRight ? '#f0fdf4' : isWrong ? '#fffbeb' : '#ffffff'}; color: #0f172a;"
        >
          {ch.text}
        </button>
      {/each}
    </div>
    {#if selectedChoice}
      <div style="border-radius: 12px; padding: 13px 15px; border: 1px solid {selectedChoice.isStrong ? '#86efac' : '#fde68a'}; background: {selectedChoice.isStrong ? '#f0fdf4' : '#fffbeb'}; font-size: 0.88rem; color: {selectedChoice.isStrong ? '#14532d' : '#78350f'}; line-height: 1.5;">
        {selectedChoice.feedback}
      </div>
    {/if}
  {:else}
    <textarea
      bind:value={learnerNote}
      rows={3}
      placeholder="Tulis penjelasan singkat 1-2 kalimat dengan bahasamu sendiri..."
      style="width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 12px; border: 1.5px solid #cbd5e1; font-family: inherit; font-size: 0.9rem; line-height: 1.5; resize: vertical;"
    ></textarea>
    <button
      type="button"
      disabled={learnerNote.trim().length < 10}
      onclick={submitSelfExplanation}
      class="fl-btn fl-btn-md"
      style="align-self: flex-start; background: {learnerNote.trim().length >= 10 ? '#0f766e' : '#cbd5e1'}; color: #ffffff; border: none; font-weight: 700;"
    >
      Bandingkan dengan Poin Kunci
    </button>
  {/if}

  {#if revealedPoints || selectedChoice?.isStrong || alreadySolved}
    <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 13px 15px;">
      <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #0f766e; margin-bottom: 6px;">
        Poin Kunci Sebab-Akibat
      </div>
      <ul style="margin: 0; padding-left: 18px; font-size: 0.87rem; color: #134e4a; line-height: 1.55;">
        {#each spec.referenceKeyPoints as pt}
          <li>{pt}</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
