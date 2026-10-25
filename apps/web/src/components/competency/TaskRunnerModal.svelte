<script lang="ts">
  import type { CompetencyNode, Task, Attempt, CompetencyLearningBundle } from '@flashlearn/shared';
  import { api } from '../../stores/api';
  import Icon from '../ui/Icon.svelte';
  import LearningSandboxTab from './LearningSandboxTab.svelte';
  import GateExamTab from './GateExamTab.svelte';

  interface Props {
    isOpen: boolean;
    competency: CompetencyNode | null;
    onClose: () => void;
    onMasteryUpdated?: () => void;
  }

  let { isOpen, competency, onClose, onMasteryUpdated }: Props = $props();

  let activeTab = $state<'sandbox' | 'exam'>('sandbox');
  let tasks = $state<Task[]>([]);
  let learningBundle = $state<CompetencyLearningBundle | null>(null);
  let selectedTaskId = $state<string | null>(null);
  let isLoading = $state(true);

  $effect(() => {
    if (isOpen && competency) {
      loadData();
    }
  });

  async function loadData() {
    if (!competency) return;
    isLoading = true;
    try {
      const [rawTasks, bundle] = await Promise.all([
        api.tasks.listByCompetency(competency.id),
        api.competencies.getLearningBundle(competency.id).catch(() => null),
      ]);

      const list = (rawTasks || []).map((t: any) => (t && t.props ? { ...t.props, ...t } : t));
      tasks = list;
      learningBundle = bundle;

      if (list.length > 0) {
        selectedTaskId = list[0].id;
      }
    } catch (err: any) {
      console.error('Failed to load competency learning data:', err);
    } finally {
      isLoading = false;
    }
  }

  function handleAttemptSubmitted(attempt: Attempt) {
    if (attempt.passed) {
      onMasteryUpdated?.();
    }
  }
</script>

{#if isOpen && competency}
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(4px);"
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <div
      role="document"
      tabindex="-1"
      style="background: #ffffff; width: 100%; max-width: 760px; max-height: 92vh; border-radius: 20px; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden;"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div style="padding: 18px 24px 12px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
            <span style="font-family: monospace; font-size: 0.75rem; font-weight: 700; color: #0f766e; background: #ccfbf1; padding: 2px 6px; border-radius: 5px;">
              {competency.code}
            </span>
            <span style="font-size: 0.75rem; font-weight: 700; color: #64748b;">
              Oracle Kelas {competency.oracleClass}
            </span>
            {#if competency.cognitiveArchetype}
              <span style="font-size: 0.72rem; font-weight: 700; color: #4338ca; background: #e0e7ff; padding: 2px 6px; border-radius: 5px;">
                {competency.cognitiveArchetype}
              </span>
            {/if}
          </div>
          <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a;">
            {competency.title}
          </h3>
        </div>

        <button
          type="button"
          onclick={onClose}
          class="fl-btn fl-btn-sm"
          style="border: none; background: #f1f5f9; width: 36px; height: 36px; min-height: 36px; border-radius: 8px; color: #64748b; padding: 0; cursor: pointer;"
          aria-label="Tutup modal"
        >
          <Icon name="xmark" size={16} />
        </button>
      </div>

      <!-- Dual-Loop Navigation Tabs -->
      <div style="display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; padding: 0 24px;">
        <button
          type="button"
          onclick={() => (activeTab = 'sandbox')}
          style="padding: 12px 18px; border: none; background: transparent; font-size: 0.85rem; font-weight: 800; color: {activeTab === 'sandbox' ? '#0f766e' : '#64748b'}; border-bottom: 3px solid {activeTab === 'sandbox' ? '#0f766e' : 'transparent'}; cursor: pointer; display: flex; align-items: center; gap: 8px;"
        >
          <Icon name="book" size={15} />
          <span>Tab 1: Belajar & Latihan (Sandbox)</span>
        </button>
        <button
          type="button"
          onclick={() => (activeTab = 'exam')}
          style="padding: 12px 18px; border: none; background: transparent; font-size: 0.85rem; font-weight: 800; color: {activeTab === 'exam' ? '#0f766e' : '#64748b'}; border-bottom: 3px solid {activeTab === 'exam' ? '#0f766e' : 'transparent'}; cursor: pointer; display: flex; align-items: center; gap: 8px;"
        >
          <Icon name="shield-check" size={15} />
          <span>Tab 2: Ujian Pembuktian (Resmi)</span>
        </button>
      </div>

      <!-- Body / Tab Content -->
      <div style="padding: 20px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; flex: 1;">
        {#if isLoading}
          <div style="text-align: center; padding: 48px; color: #94a3b8; font-weight: 600;">
            Memuat materi pembelajaran terpadu & tugas...
          </div>
        {:else if activeTab === 'sandbox'}
          {#if learningBundle}
            <LearningSandboxTab
              bundle={learningBundle}
              onProceedToExam={() => (activeTab = 'exam')}
            />
          {:else}
            <div style="text-align: center; padding: 36px; color: #64748b;">
              Materi latihan belum siap. Beralih ke ujian langsung?
              <br /><br />
              <button
                type="button"
                onclick={() => (activeTab = 'exam')}
                class="fl-btn fl-btn-primary"
              >
                Buka Ujian Pembuktian
              </button>
            </div>
          {/if}
        {:else if activeTab === 'exam'}
          <GateExamTab
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            competency={competency}
            onSelectTask={(id) => (selectedTaskId = id)}
            onAttemptSubmitted={handleAttemptSubmitted}
            onRequestScaffoldingHelp={() => (activeTab = 'sandbox')}
          />
        {/if}
      </div>
    </div>
  </div>
{/if}
