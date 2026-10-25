<script lang="ts">
  import type { Task, Attempt, CompetencyNode } from '@flashlearn/shared';
  import TaskExecutionForm from './TaskExecutionForm.svelte';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    tasks: Task[];
    selectedTaskId: string | null;
    competency: CompetencyNode;
    onSelectTask: (id: string) => void;
    onAttemptSubmitted: (attempt: Attempt) => void;
    onRequestScaffoldingHelp: () => void;
  }

  let {
    tasks,
    selectedTaskId,
    competency,
    onSelectTask,
    onAttemptSubmitted,
    onRequestScaffoldingHelp,
  }: Props = $props();

  let showDowngradeConfirm = $state(false);

  let currentTask = $derived(tasks.find((t) => t.id === selectedTaskId) || tasks[0] || null);
  let passedVariants = $derived<string[]>((competency as any)?.passedVariantCodes || []);
  let variantCode = $derived(currentTask?.scenarioVariantCode || 'variant_a');

  function confirmDowngrade() {
    showDowngradeConfirm = false;
    onRequestScaffoldingHelp();
  }
</script>

<div class="gate-exam-tab" style="display: flex; flex-direction: column; gap: 16px;">
  <!-- Official Verification Header Badge -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="background: #0f766e; color: #ffffff; border-radius: 8px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; shrink: 0;">
        <Icon name="shield-check" size={16} />
      </div>
      <div>
        <div style="font-size: 0.85rem; font-weight: 800; color: #0f172a;">
          Mode Ujian Pembuktian Wewenang (Resmi)
        </div>
        <div style="font-size: 0.75rem; color: #64748b;">
          Evaluasi Oracle Kelas {competency.oracleClass} • Syarat Kelulusan Skor ≥ {currentTask?.passingScore || 80}%
        </div>
      </div>
    </div>

    <!-- Graceful Downgrade Trigger Button -->
    <button
      type="button"
      onclick={() => (showDowngradeConfirm = true)}
      class="fl-btn fl-btn-sm"
      style="background: #fffbeb; border: 1px solid #fde68a; color: #b45309; font-size: 0.75rem; font-weight: 700; border-radius: 6px; padding: 6px 10px; cursor: pointer;"
    >
      <Icon name="question-circle" size={14} />
      <span>Buntu? Buka Panduan Langkah</span>
    </button>
  </div>

  <!-- Multi-Observation Entrustment Indicator -->
  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <Icon name="check-double" size={15} class="text-teal-700" />
      <span style="font-size: 0.78rem; font-weight: 700; color: #115e59;">
        Multi-Observation Entrustment:
      </span>
      <span style="font-size: 0.75rem; background: #ccfbf1; color: #0f766e; padding: 2px 8px; border-radius: 6px; font-weight: 800;">
        {variantCode.toUpperCase()}
      </span>
      {#if currentTask?.isIsomorphicVariant}
        <span style="font-size: 0.72rem; background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 5px; font-weight: 600;">
          Kasus Isomorfik
        </span>
      {/if}
    </div>
    <div style="font-size: 0.75rem; color: #047857; font-weight: 700;">
      {passedVariants.length > 0 ? `Lulus ${passedVariants.length} Observasi (${passedVariants.join(', ')})` : 'Observasi Kasus (Wajib Mandiri 100%)'}
    </div>
  </div>

  <!-- Task Selector if multiple tasks exist -->
  {#if tasks.length > 1}
    <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px;">
      {#each tasks as t, idx}
        <button
          type="button"
          onclick={() => onSelectTask(t.id)}
          class="fl-btn fl-btn-sm fl-pill-btn"
          style="border: none; font-size: 0.78rem; font-weight: 700; background: {selectedTaskId === t.id ? '#0f766e' : '#f1f5f9'}; color: {selectedTaskId === t.id ? '#ffffff' : '#64748b'}; cursor: pointer;"
        >
          <span>Tugas {idx + 1}: {t.title.slice(0, 28)}...</span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Task Execution Form -->
  {#if currentTask}
    <TaskExecutionForm
      task={currentTask}
      oracleClass={competency.oracleClass}
      onAttemptSubmitted={onAttemptSubmitted}
    />
  {:else}
    <div style="text-align: center; padding: 36px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1; color: #64748b;">
      Belum ada tugas Oracle yang terdaftar untuk kompetensi ini.
    </div>
  {/if}

  <!-- Modal Konfirmasi Graceful Downgrade -->
  {#if showDowngradeConfirm}
    <div
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); z-index: 10005; display: flex; align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(2px);"
      onclick={() => (showDowngradeConfirm = false)}
      onkeydown={(e) => e.key === 'Escape' && (showDowngradeConfirm = false)}
    >
      <div
        role="document"
        tabindex="-1"
        style="background: #ffffff; width: 100%; max-width: 440px; border-radius: 16px; padding: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <div style="background: #fef3c7; color: #d97706; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
            <Icon name="exclamation-triangle" size={18} />
          </div>
          <h4 style="margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a;">
            Beralih ke Mode Latihan?
          </h4>
        </div>

        <p style="margin: 0 0 16px 0; font-size: 0.82rem; color: #475569; line-height: 1.5;">
          Membuka panduan langkah kerja akan mengalihkan sesi Anda kembali ke <strong>Tab Mode Latihan (Sandbox)</strong>.
          <br /><br />
          Penilaian bantuan langkah <em>tidak akan dihitung</em> untuk membuka Gerbang Otoritas (Gate Passport), demi menjaga keabsahan verifikasi wewenang. Anda dapat mengulang ujian resmi kembali kapan saja setelah siap.
        </p>

        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button
            type="button"
            onclick={() => (showDowngradeConfirm = false)}
            class="fl-btn fl-btn-sm"
            style="border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; border-radius: 8px; padding: 8px 14px; font-weight: 600;"
          >
            Tetap di Ujian Resmi
          </button>
          <button
            type="button"
            onclick={confirmDowngrade}
            class="fl-btn fl-btn-sm"
            style="border: none; background: #0f766e; color: #ffffff; border-radius: 8px; padding: 8px 16px; font-weight: 700;"
          >
            Ya, Buka Mode Latihan
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
