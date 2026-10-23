<script lang="ts">
  interface Props {
    averageScore: number;
    passingRate: number;
    passingCount: number;
    totalParticipants: number;
    missedQuestionsCount: number;
    totalQuestions: number;
    mostMissedQuestion: any;
  }

  let {
    averageScore,
    passingRate,
    passingCount,
    totalParticipants,
    missedQuestionsCount,
    totalQuestions,
    mostMissedQuestion,
  }: Props = $props();
</script>

<div
  style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 22px;"
>
  <div
    style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
  >
    <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">
      Rata-rata Nilai
    </div>
    <div
      style="font-size: 1.6rem; font-weight: 800; color: {averageScore >= 70
        ? '#16a34a'
        : '#ea580c'}; margin-top: 2px;"
    >
      {averageScore}%
    </div>
    <div style="font-size: 0.75rem; color: #64748b;">
      Tingkat Kelulusan: <strong>{passingRate}% ({passingCount}/{totalParticipants})</strong>
    </div>
  </div>

  <div
    style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
  >
    <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">
      Soal Perlu Dibahas
    </div>
    <div
      style="font-size: 1.6rem; font-weight: 800; color: {missedQuestionsCount > 0
        ? '#dc2626'
        : '#16a34a'}; margin-top: 2px;"
    >
      {missedQuestionsCount} Soal
    </div>
    <div style="font-size: 0.75rem; color: #64748b;">
      {totalQuestions - missedQuestionsCount} soal dijawab 100% tepat
    </div>
  </div>

  <div
    style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
  >
    <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">
      Soal Paling Banyak Salah
    </div>
    <div style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-top: 4px;">
      {#if mostMissedQuestion && mostMissedQuestion.wrongCount > 0}
        Soal #{mostMissedQuestion.index} <span style="font-size: 0.85rem; color: #dc2626; font-weight: 700;">({mostMissedQuestion.wrongRate}% Salah)</span>
      {:else}
        <span style="font-size: 0.95rem; color: #16a34a; font-weight: 700;">Nihil (Sempurna)</span>
      {/if}
    </div>
    <div style="font-size: 0.75rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
      {#if mostMissedQuestion && mostMissedQuestion.wrongCount > 0}
        {mostMissedQuestion.wrongCount} dari {totalParticipants} peserta salah
      {:else}
        Semua soal berhasil dijawab
      {/if}
    </div>
  </div>
</div>
