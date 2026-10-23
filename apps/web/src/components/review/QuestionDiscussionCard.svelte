<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import ChipBadge from '../ui/ChipBadge.svelte';

  interface Props {
    item: any;
  }

  let { item }: Props = $props();
</script>

<div
  class="fl-feature-card"
  style="background: #ffffff; border: 1.5px solid {item.wrongRate >= 50
    ? '#fecaca'
    : item.wrongCount > 0
    ? '#fed7aa'
    : '#e2e8f0'}; border-radius: 16px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);"
>
  <!-- Question Top Header -->
  <div
    style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;"
  >
    <div style="display: flex; align-items: center; gap: 8px;">
      <span
        style="background: #0f766e; color: #ffffff; font-weight: 800; font-size: 0.825rem; padding: 3px 10px; border-radius: 6px;"
      >
        SOAL #{item.index}
      </span>
      {#if item.question.difficulty}
        <span
          style="font-size: 0.725rem; font-weight: 700; text-transform: uppercase; color: #64748b; background: #f1f5f9; padding: 3px 8px; border-radius: 6px;"
        >
          {item.question.difficulty}
        </span>
      {/if}
    </div>

    <div>
      {#if item.wrongRate >= 50}
        <ChipBadge
          variant="danger"
          icon="exclamation-circle"
          label="{item.wrongCount}/{item.totalAnswered} Peserta Salah ({item.wrongRate}%)"
        />
      {:else if item.wrongCount > 0}
        <ChipBadge
          variant="warning"
          icon="exclamation-circle"
          label="{item.wrongCount}/{item.totalAnswered} Peserta Salah ({item.wrongRate}%)"
        />
      {:else}
        <ChipBadge
          variant="success"
          icon="check-circle"
          label="100% Tepat ({item.correctCount} Benar)"
        />
      {/if}
    </div>
  </div>

  <!-- Question Text -->
  <h4
    style="margin: 0 0 16px 0; font-size: 1.05rem; font-weight: 700; color: #0f172a; line-height: 1.45;"
  >
    {item.question.question}
  </h4>

  <!-- Options Breakdown with Distribution Bar Chart -->
  <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
    {#each item.optionsStats as opt, optIdx}
      {@const isTopMisconception = item.topDistractor?.id === opt.id && opt.pickCount > 0}
      <div
        style="border: 1.5px solid {opt.isCorrect
          ? '#86efac'
          : isTopMisconception
          ? '#fcd34d'
          : '#e2e8f0'}; background: {opt.isCorrect
          ? '#f0fdf4'
          : isTopMisconception
          ? '#fffbeb'
          : '#ffffff'}; border-radius: 10px; padding: 10px 14px; position: relative;"
      >
        <div
          style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap;"
        >
          <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
            <span
              style="width: 22px; height: 22px; border-radius: 50%; background: {opt.isCorrect
                ? '#16a34a'
                : isTopMisconception
                ? '#d97706'
                : '#64748b'}; color: #ffffff; font-weight: 800; font-size: 0.725rem; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;"
            >
              {String.fromCharCode(65 + optIdx)}
            </span>
            <span
              style="font-size: 0.9rem; font-weight: {opt.isCorrect ? '700' : '500'}; color: {opt.isCorrect
                ? '#166534'
                : '#1e293b'};"
            >
              {opt.text}
            </span>
          </div>

          <div style="display: flex; gap: 6px; align-items: center;">
            {#if opt.isCorrect}
              <span
                style="background: #dcfce7; color: #166534; font-size: 0.725rem; font-weight: 800; padding: 2px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;"
              >
                <Icon name="check" size={11} strokeWidth={3} />
                <span>KUNCI JAWABAN BENAR</span>
              </span>
            {:else if isTopMisconception}
              <span
                style="background: #fef3c7; color: #92400e; font-size: 0.725rem; font-weight: 800; padding: 2px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;"
              >
                <Icon name="exclamation-circle" size={12} />
                <span>PALING BANYAK TERKECOH</span>
              </span>
            {/if}

            <span
              style="font-size: 0.825rem; font-weight: 800; color: {opt.isCorrect
                ? '#166534'
                : isTopMisconception
                ? '#b45309'
                : '#64748b'}; white-space: nowrap;"
            >
              {opt.percentage}% ({opt.pickCount} peserta)
            </span>
          </div>
        </div>

        <div
          style="width: 100%; height: 6px; background: rgba(0,0,0,0.06); border-radius: 9999px; overflow: hidden;"
        >
          <div
            style="height: 100%; width: {opt.percentage}%; background: {opt.isCorrect
              ? '#22c55e'
              : isTopMisconception
              ? '#f59e0b'
              : '#94a3b8'}; border-radius: 9999px; transition: width 0.3s ease;"
          ></div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Explanation & Discussion Guide Panel -->
  {#if item.question.explanation}
    <div
      style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px; padding: 12px 16px;"
    >
      <div
        style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; color: #0f766e; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.03em;"
      >
        <Icon name="sparkles" size={13} />
        <span>Bahan Diskusi & Pembahasan Guru:</span>
      </div>
      <p style="margin: 0; font-size: 0.85rem; color: #134e4a; line-height: 1.55;">
        {item.question.explanation}
      </p>
    </div>
  {/if}
</div>
