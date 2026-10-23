<script lang="ts">
  import type { Task, Attempt } from '@flashlearn/shared';
  import { api } from '../../stores/api';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    task: Task;
    oracleClass: 'A' | 'B' | 'C' | string;
    onAttemptSubmitted: (attempt: Attempt) => void;
  }

  let { task, oracleClass, onAttemptSubmitted }: Props = $props();

  let isSubmitting = $state(false);
  let calculatedValue = $state<number | string>('');
  let studentAnswerText = $state('');
  let checkedItems = $state<Record<string, boolean>>({});
  let lastAttempt = $state<Attempt | null>(null);

  async function handleSubmit() {
    isSubmitting = true;
    try {
      const submissionData: Record<string, any> = {};

      if (oracleClass === 'A') {
        submissionData.calculatedValue = Number(calculatedValue);
        submissionData.completedChecklist = Object.keys(checkedItems).filter((k) => checkedItems[k]);
      } else {
        submissionData.studentAnswerText = studentAnswerText;
      }

      const res = await api.tasks.submitAttempt(task.id, {
        submissionData,
        studentAnswerText: studentAnswerText || undefined,
      });

      lastAttempt = res;
      onAttemptSubmitted(res);
    } catch (err: any) {
      alert(`Gagal evaluasi tugas: ${err.message}`);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div style="display: flex; flex-direction: column; gap: 14px;">
  <!-- Scenario -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
    <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
      Skenario Tugas Nyata:
    </div>
    <div style="font-size: 0.9rem; color: #1e293b; line-height: 1.5;">
      {task.scenario}
    </div>
  </div>

  <!-- Form Inputs Based on Oracle Class -->
  {#if oracleClass === 'A'}
    <div style="display: flex; flex-direction: column; gap: 10px;">
      {#if task.oracleData?.checklist}
        <div style="font-size: 0.8rem; font-weight: 700; color: #334155;">Checklist Kelengkapan Regulasi:</div>
        {#each task.oracleData.checklist as itemKey}
          <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #1e293b; cursor: pointer;">
            <input type="checkbox" bind:checked={checkedItems[itemKey]} style="accent-color: #0f766e;" />
            <span style="font-family: monospace; font-size: 0.82rem;">{itemKey}</span>
          </label>
        {/each}
      {/if}

      <div>
        <label for="hps-input" style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 4px;">
          Hasil Nilai Perhitungan Total (Rp):
        </label>
        <input
          id="hps-input"
          type="number"
          placeholder="Misal: 127650000"
          bind:value={calculatedValue}
          style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.95rem; font-family: monospace;"
        />
      </div>
    </div>
  {:else}
    <div>
      <label for="analysis-input" style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 4px;">
        Dokumen Analisis / Jawaban Yuridis:
      </label>
      <textarea
        id="analysis-input"
        rows="5"
        placeholder="Tuliskan analisis komprehensif, pasal rujukan, dan kesimpulan pertimbangan hukum Anda..."
        bind:value={studentAnswerText}
        style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.88rem; line-height: 1.45;"
      ></textarea>
    </div>
  {/if}

  <button
    disabled={isSubmitting}
    onclick={handleSubmit}
    style="background: #0f766e; color: #ffffff; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;"
  >
    <Icon name="check-circle" size={16} />
    <span>{isSubmitting ? 'Mengevaluasi via Oracle...' : 'Kirim Solusi untuk Dinilai'}</span>
  </button>

  <!-- Last Evaluation Feedback -->
  {#if lastAttempt}
    <div
      style="border-radius: 12px; padding: 14px; margin-top: 4px; border: 1px solid {lastAttempt.passed ? '#bbf7d0' : '#fecaca'}; background: {lastAttempt.passed ? '#f0fdf4' : '#fef2f2'};"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="font-weight: 800; font-size: 0.9rem; color: {lastAttempt.passed ? '#166534' : '#991b1b'}; display: flex; align-items: center; gap: 6px;">
          <Icon name={lastAttempt.passed ? 'check-circle' : 'alert-triangle'} size={15} />
          {lastAttempt.passed ? 'Lulus Evaluasi Oracle!' : 'Belum Memenuhi Passing Score'}
        </span>
        <span style="font-weight: 800; font-size: 0.95rem; color: #0f766e;">
          Skor: {lastAttempt.score}%
        </span>
      </div>
      <p style="margin: 0; font-size: 0.85rem; color: #334155; line-height: 1.45;">
        {lastAttempt.feedback}
      </p>
    </div>
  {/if}
</div>
