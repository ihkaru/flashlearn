<script lang="ts">
  import type { PendingReviewItem } from '../../stores/api/reviewer';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    item: PendingReviewItem;
    onEvaluate: (attemptId: string, passed: boolean, rubricScores: any[], notes: string) => Promise<void>;
  }

  let { item, onEvaluate }: Props = $props();

  let isSubmitting = $state(false);
  let expertNotes = $state('');
  let passed = $state(true);
  let rubricScores = $state<any[]>([]);
  let showTranscript = $state(false);

  const conversationAudit = $derived(
    item.attempt.submissionData?.conversationAudit || (item.attempt as any).conversationAudit
  );

  $effect(() => {
    rubricScores = (item.task.oracleCriteria?.rubric || []).map((r: any) => ({
      criterionId: r.id || 'crit_1',
      name: r.name || 'Kriteria Penilaian',
      scoreAwarded: r.maxScore || 100,
      maxScore: r.maxScore || 100,
      feedback: '',
    }));
  });

  async function handleSubmit() {
    isSubmitting = true;
    try {
      await onEvaluate(item.attempt.id, passed, rubricScores, expertNotes);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div
  style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 14px;"
>
  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
    <div>
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <span style="font-size: 0.75rem; font-weight: 700; background: #faf5ff; color: #7e22ce; padding: 2px 8px; border-radius: 6px;">
          Kelas C · Pakar
        </span>
        <span style="font-size: 0.8rem; font-weight: 700; color: #0f766e;">
          Peserta: {item.studentName || 'Anonim'}
        </span>
      </div>
      <h4 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a;">
        {item.task.title}
      </h4>
    </div>
  </div>

  <!-- Student Submission Text -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px;">
    <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
      Jawaban / Analisis Peserta:
    </div>
    <div style="font-size: 0.88rem; color: #1e293b; white-space: pre-wrap; line-height: 1.5;">
      {item.attempt.submissionData?.studentAnswerText || JSON.stringify(item.attempt.submissionData, null, 2)}
    </div>
  </div>

  <!-- Phase 18: Conversational Audit Inspector -->
  {#if conversationAudit}
    <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; background: #fafafa;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <Icon name="chat_bubble_text" size={14} color="#4f46e5" />
          <span style="font-size: 0.8rem; font-weight: 700; color: #1e293b;">
            Audit Percakapan AI Lumis
          </span>
          {#if conversationAudit.isFlaggedForExtraction}
            <span style="font-size: 0.7rem; font-weight: 800; background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px;">
              ⚠️ Indikasi Ekstraksi Jawaban
            </span>
          {:else}
            <span style="font-size: 0.7rem; font-weight: 700; background: #ecfdf5; color: #047857; padding: 2px 6px; border-radius: 4px;">
              ✓ Merkle Verified
            </span>
          {/if}
        </div>
        <button
          type="button"
          onclick={() => showTranscript = !showTranscript}
          style="border: none; background: none; font-size: 0.75rem; font-weight: 700; color: #4f46e5; cursor: pointer;"
        >
          {showTranscript ? 'Sembunyikan' : 'Buka Transkrip'}
        </button>
      </div>

      {#if showTranscript}
        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 0.7rem; color: #64748b; word-break: break-all;">
            Merkle Root: <code>{conversationAudit.merkleRootHash}</code>
          </div>
          {#each (conversationAudit.messages || []) as msg}
            <div style="padding: 8px 10px; border-radius: 6px; font-size: 0.8rem; background: {msg.role === 'user' ? '#eef2ff' : '#ffffff'}; border: 1px solid #e2e8f0;">
              <span style="font-weight: 700; color: {msg.role === 'user' ? '#4338ca' : '#0f766e'};">
                {msg.role === 'user' ? 'Peserta' : 'Tutor Lumis'}:
              </span>
              <span style="color: #334155; margin-left: 4px;">{msg.content}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Rubric Sliders / Inputs -->
  <div style="display: flex; flex-direction: column; gap: 10px;">
    <div style="font-size: 0.8rem; font-weight: 700; color: #334155;">Rubrik Penilaian Pakar:</div>
    {#each rubricScores as rub, idx}
      <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.82rem; font-weight: 600; color: #1e293b;">{rub.name}</span>
          <span style="font-size: 0.82rem; font-weight: 700; color: #0f766e;">
            Skor: {rub.scoreAwarded} / {rub.maxScore}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={rub.maxScore}
          bind:value={rub.scoreAwarded}
          style="width: 100%; accent-color: #0f766e;"
        />
        <input
          type="text"
          placeholder="Catatan umpan balik untuk kriteria ini..."
          bind:value={rub.feedback}
          style="font-size: 0.8rem; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1;"
        />
      </div>
    {/each}
  </div>

  <!-- Notes & Verdict -->
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <label style="font-size: 0.8rem; font-weight: 700; color: #334155;">
      Catatan Verifikasi & Justifikasi Pakar:
    </label>
    <textarea
      rows="2"
      bind:value={expertNotes}
      placeholder="Berikan alasan kelulusan atau perbaikan yang dibutuhkan..."
      style="font-size: 0.82rem; padding: 8px 10px; border-radius: 8px; border: 1px solid #cbd5e1; width: 100%; box-sizing: border-box;"
    ></textarea>
  </div>

  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #f1f5f9;">
    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 700;">
      <input type="checkbox" bind:checked={passed} style="accent-color: #0f766e; width: 16px; height: 16px;" />
      <span style="color: {passed ? '#15803d' : '#b91c1c'};">
        {passed ? 'Nyatakan Lulus Kompetensi' : 'Tolak / Belum Memenuhi'}
      </span>
    </label>

    <button
      disabled={isSubmitting}
      onclick={handleSubmit}
      class="fl-btn fl-btn-sm"
      style="background: #0f766e; color: #ffffff; border: none; font-weight: 700; font-size: 0.85rem;"
    >
      <Icon name="check-circle" size={14} />
      <span>{isSubmitting ? 'Menyimpan...' : 'Tandatangani Verifikasi'}</span>
    </button>
  </div>
</div>
