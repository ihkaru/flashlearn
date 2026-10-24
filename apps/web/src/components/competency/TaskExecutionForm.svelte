<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Task, Attempt } from '@flashlearn/shared';
  import { api } from '../../stores/api';
  import { lumisChat } from '../../stores/lumisChat.svelte';
  import Icon from '../ui/Icon.svelte';
  import SocraticTutorDrawer from './SocraticTutorDrawer.svelte';

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
  let selectedDisposition = $state<'REJECT_AND_DEMAND_DATA' | 'ACCEPT_AND_SIGN' | 'DELEGATE' | ''>('');
  let lastAttempt = $state<Attempt | null>(null);
  let conversationAudit = $state<any>(null);

  function handleDraftAdopted(e: any) {
    const draft = e.detail?.draft;
    if (draft && typeof draft === 'string') {
      if (!studentAnswerText) {
        studentAnswerText = draft;
      } else {
        studentAnswerText = `${studentAnswerText}\n\n${draft}`;
      }
    }
    if (e.detail?.conversationAudit) {
      conversationAudit = e.detail.conversationAudit;
    }
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('flashlearn:draft_adopted', handleDraftAdopted);
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('flashlearn:draft_adopted', handleDraftAdopted);
    }
  });

  let isAdversarial = $derived(task.taskType === 'adversarial_dilemma');
  let hasCalculation = $derived(
    task.taskType === 'calculation' || !!task.oracleData?.expectedFormulas || !!task.oracleData?.targetField
  );
  let hasChecklist = $derived(
    task.taskType === 'checklist' || (Array.isArray(task.oracleData?.checklist) && task.oracleData.checklist.length > 0)
  );

  let calcLabel = $derived(
    task.oracleData?.inputLabel || task.oracleData?.targetField || 'Nilai Hasil Perhitungan / Ukuran Target'
  );
  let calcUnit = $derived(task.oracleData?.unit ? ` (${task.oracleData.unit})` : '');
  let calcPlaceholder = $derived(task.oracleData?.placeholder || 'Masukkan nilai angka hasil kalkulasi...');
  let checklistLabel = $derived(task.oracleData?.checklistLabel || 'Checklist Kelengkapan / Validasi:');
  let analysisLabel = $derived(task.oracleData?.submissionLabel || 'Dokumen Analisis / Solusi Terstruktur:');
  let analysisPlaceholder = $derived(
    task.oracleData?.submissionPlaceholder || 'Tuliskan analisis komprehensif, argumen rujukan standar, dan kesimpulan solusi Anda...'
  );

  async function handleSubmit() {
    if (isAdversarial && !selectedDisposition) {
      alert('Pilihlah salah satu Disposisi Keputusan terlebih dahulu sebelum mengirimkan evaluasi.');
      return;
    }
    if (isAdversarial && studentAnswerText.trim().length < 5) {
      alert('Tuliskan justifikasi analisis regulasi secara rinci.');
      return;
    }

    isSubmitting = true;
    try {
      const submissionData: Record<string, any> = {};

      if (isAdversarial) {
        submissionData.studentDisposition = selectedDisposition;
        submissionData.studentAnswerText = studentAnswerText;
        submissionData.justification = studentAnswerText;
        submissionData.text = studentAnswerText;
      } else {
        if (hasCalculation) {
          const numVal = Number(calculatedValue);
          submissionData.calculatedValue = numVal;
          const targetKey = task.oracleData?.targetField;
          if (targetKey) {
            submissionData[targetKey] = numVal;
          }
        }
        if (hasChecklist) {
          submissionData.completedChecklist = Object.keys(checkedItems).filter((k) => checkedItems[k]);
          for (const item of Object.keys(checkedItems).filter((k) => checkedItems[k])) {
            submissionData[item] = true;
          }
        }
        if (studentAnswerText.trim()) {
          submissionData.studentAnswerText = studentAnswerText;
          submissionData.text = studentAnswerText;
        }
      }

      const res = await api.tasks.submitAttempt(task.id, {
        submissionData,
        studentAnswerText: studentAnswerText || undefined,
        conversationAudit: conversationAudit || undefined,
        conversationHash: conversationAudit?.merkleRootHash || undefined,
      });

      lastAttempt = res?.attempt || res;
      onAttemptSubmitted(lastAttempt);
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

  <!-- Socratic Pedagogical Tutor -->
  <SocraticTutorDrawer taskId={task.id} scenario={task.scenario} taskTitle={task.title} />

  <!-- Form Inputs Based on Oracle Class -->
  {#if isAdversarial}
    <div style="display: flex; flex-direction: column; gap: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px;">
      <div style="font-size: 0.8rem; font-weight: 800; color: #b45309; display: flex; align-items: center; gap: 6px;">
        <Icon name="alert-triangle" size={14} />
        <span>Uji Stres Tekanan & Integritas Batas Wewenang</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <span style="font-size: 0.82rem; font-weight: 700; color: #334155;">Pilih Disposisi Anda:</span>
        
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #1e293b; cursor: pointer; padding: 8px; border-radius: 8px; background: #ffffff; border: 1px solid {selectedDisposition === 'REJECT_AND_DEMAND_DATA' ? '#0f766e' : '#e2e8f0'};">
          <input type="radio" name="disposition" value="REJECT_AND_DEMAND_DATA" bind:group={selectedDisposition} style="accent-color: #0f766e;" />
          <span style="font-weight: 600;">Tolak & Tuntut Kelengkapan Data / Dokumen (Tahan Batas)</span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #1e293b; cursor: pointer; padding: 8px; border-radius: 8px; background: #ffffff; border: 1px solid {selectedDisposition === 'ACCEPT_AND_SIGN' ? '#dc2626' : '#e2e8f0'};">
          <input type="radio" name="disposition" value="ACCEPT_AND_SIGN" bind:group={selectedDisposition} style="accent-color: #dc2626;" />
          <span style="font-weight: 600;">Setujui & Tanda Tangani Berkas (Akomodasi Desakan Waktu)</span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #1e293b; cursor: pointer; padding: 8px; border-radius: 8px; background: #ffffff; border: 1px solid {selectedDisposition === 'DELEGATE' ? '#0284c7' : '#e2e8f0'};">
          <input type="radio" name="disposition" value="DELEGATE" bind:group={selectedDisposition} style="accent-color: #0284c7;" />
          <span style="font-weight: 600;">Eskalasi ke Komite Etik / Pimpinan Tertinggi Tanpa Tanda Tangan</span>
        </label>
      </div>

      <div>
        <label for="adv-justification" style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 4px;">
          Dasar Regulasi & Analisis Justifikasi:
        </label>
        <textarea
          id="adv-justification"
          rows="4"
          placeholder="Tuliskan klausul regulasi atau SOP rujukan serta alasan detail di balik disposisi Anda..."
          bind:value={studentAnswerText}
          style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.88rem; line-height: 1.45;"
        ></textarea>
      </div>
    </div>
  {:else}
    <div style="display: flex; flex-direction: column; gap: 12px;">
      {#if hasChecklist && task.oracleData?.checklist}
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 0.8rem; font-weight: 700; color: #334155;">{checklistLabel}</div>
          {#each task.oracleData.checklist as itemKey}
            <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.85rem; color: #1e293b; cursor: pointer; background: #f8fafc; padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <input type="checkbox" bind:checked={checkedItems[itemKey]} style="accent-color: #0f766e; margin-top: 2px;" />
              <span style="font-size: 0.82rem; line-height: 1.4;">{itemKey}</span>
            </label>
          {/each}
        </div>
      {/if}

      {#if hasCalculation}
        <div>
          <label for="calc-input" style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 4px;">
            {calcLabel}{calcUnit}:
          </label>
          <input
            id="calc-input"
            type="number"
            placeholder={calcPlaceholder}
            bind:value={calculatedValue}
            style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.95rem; font-family: monospace;"
          />
        </div>
      {/if}

      {#if !hasCalculation || task.taskType === 'case_study' || task.taskType === 'document_draft'}
        <div>
          <label for="analysis-input" style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 4px;">
            {analysisLabel}
          </label>
          <textarea
            id="analysis-input"
            rows="5"
            placeholder={analysisPlaceholder}
            bind:value={studentAnswerText}
            style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.88rem; line-height: 1.45;"
          ></textarea>
        </div>
      {/if}
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

      {#if lastAttempt.conversationHash || (lastAttempt as any).merkleRootHash}
        <div style="margin-top: 8px; padding: 6px 10px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.72rem; font-family: monospace; color: #475569; display: flex; align-items: center; justify-content: space-between;">
          <span>🔒 Bukti Kriptografis FIPS 180-4:</span>
          <span style="font-weight: 700;">{((lastAttempt as any).merkleRootHash || lastAttempt.conversationHash || '').slice(0, 24)}...</span>
        </div>
      {/if}

      <div style="margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 8px; display: flex; justify-content: flex-end;">
        <button
          type="button"
          onclick={() =>
            lumisChat.askAdversarialDebrief({
              taskTitle: task.title,
              scenario: task.scenario,
              statutoryPolicy: task.adversarialSpec?.statutoryPolicy,
              learnerChoice: selectedDisposition,
            })}
          style="background: #ffffff; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; color: #0f766e; cursor: pointer; display: flex; align-items: center; gap: 6px;"
        >
          <Icon name="chat" size={13} />
          <span>Debrief & Refleksi Integritas dengan AI Tutor</span>
        </button>
      </div>
    </div>
  {/if}
</div>
