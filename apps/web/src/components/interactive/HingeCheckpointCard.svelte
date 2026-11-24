<script lang="ts">
  import type { HingeCheckSpec } from '@flashlearn/shared';

  interface Props {
    check: HingeCheckSpec;
    alreadySolved: boolean;
    onSolved: () => void;
  }

  let { check, alreadySolved, onSolved }: Props = $props();

  let pickedId = $state<string | null>(null);
  const pickedOpt = $derived(check.options.find((o) => o.id === pickedId) || null);

  function pick(id: string) {
    pickedId = id;
    const opt = check.options.find((o) => o.id === id);
    if (opt?.isCorrect) {
      onSolved();
    }
  }
</script>

<div style="display: flex; flex-direction: column; gap: 14px;">
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px 16px;">
    <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #0f766e; margin-bottom: 6px;">
      Cek Titik Engsel (20 Detik)
    </div>
    <p style="margin: 0; font-size: 0.96rem; font-weight: 700; color: #0f172a; line-height: 1.55;">
      {check.prompt}
    </p>
  </div>

  <div style="display: flex; flex-direction: column; gap: 9px;">
    {#each check.options as opt (opt.id)}
      {@const isPicked = pickedId === opt.id}
      {@const isRight = isPicked && opt.isCorrect}
      {@const isWrong = isPicked && !opt.isCorrect}
      <button
        type="button"
        onclick={() => pick(opt.id)}
        class="fl-btn-wrap"
        style="width: 100%; min-height: 48px; padding: 12px 15px; border-radius: 12px; text-align: left; font-size: 0.9rem; font-weight: 600; line-height: 1.45; border: 1.5px solid {isRight ? '#16a34a' : isWrong ? '#f59e0b' : '#cbd5e1'}; background: {isRight ? '#f0fdf4' : isWrong ? '#fffbeb' : '#ffffff'}; color: #0f172a;"
      >
        {opt.text}
      </button>
    {/each}
  </div>

  {#if pickedOpt}
    {#key pickedOpt.id}
      <div
        class={pickedOpt.isCorrect ? 'fl-feedback-correct' : 'fl-feedback-nudge'}
        style="border-radius: 12px; padding: 14px 16px; border: 1px solid {pickedOpt.isCorrect ? '#86efac' : '#fde68a'}; background: {pickedOpt.isCorrect ? '#f0fdf4' : '#fffbeb'};"
      >
      <div style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: {pickedOpt.isCorrect ? '#15803d' : '#b45309'}; margin-bottom: 4px;">
        {pickedOpt.isCorrect ? 'Siap lanjut' : 'Perbaikan singkat sebelum lanjut'}
      </div>
      <p style="margin: 0; font-size: 0.88rem; color: {pickedOpt.isCorrect ? '#14532d' : '#78350f'}; line-height: 1.5;">
        {pickedOpt.feedback}
      </p>
      {#if !pickedOpt.isCorrect && check.remediationCard}
        <p style="margin: 8px 0 0 0; padding-top: 8px; border-top: 1px solid #fde68a; font-size: 0.86rem; color: #78350f; line-height: 1.5;">
          <strong>Ingat intinya:</strong> {check.remediationCard}
        </p>
      {/if}
      </div>
    {/key}
  {:else if alreadySolved}
    <div style="border-radius: 10px; padding: 10px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; font-size: 0.84rem; color: #166534; font-weight: 600;">
      Cek singkat ini sudah selesai. Kamu bisa lanjut ke langkah berikutnya.
    </div>
  {/if}
</div>
