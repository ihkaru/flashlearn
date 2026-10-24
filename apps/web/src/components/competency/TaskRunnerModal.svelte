<script lang="ts">
  import { onMount } from 'svelte';
  import type { CompetencyNode, Task, Attempt } from '@flashlearn/shared';
  import { api } from '../../stores/api';
  import TaskExecutionForm from './TaskExecutionForm.svelte';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    isOpen: boolean;
    competency: CompetencyNode | null;
    onClose: () => void;
    onMasteryUpdated?: () => void;
  }

  let { isOpen, competency, onClose, onMasteryUpdated }: Props = $props();

  let tasks = $state<Task[]>([]);
  let selectedTaskId = $state<string | null>(null);
  let isLoading = $state(true);

  $effect(() => {
    if (isOpen && competency) {
      loadTasks();
    }
  });

  async function loadTasks() {
    if (!competency) return;
    isLoading = true;
    try {
      const rawList = await api.tasks.listByCompetency(competency.id);
      const list = (rawList || []).map((t: any) => (t && t.props ? { ...t.props, ...t } : t));
      tasks = list;
      if (list.length > 0) {
        selectedTaskId = list[0].id;
      }
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
    } finally {
      isLoading = false;
    }
  }

  let currentTask = $derived(tasks.find((t) => t.id === selectedTaskId) || null);

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
    style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(4px);"
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <div
      style="background: #ffffff; width: 100%; max-width: 680px; max-height: 90vh; border-radius: 20px; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden;"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div style="padding: 18px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
            <span style="font-family: monospace; font-size: 0.75rem; font-weight: 700; color: #0f766e; background: #ccfbf1; padding: 2px 6px; border-radius: 5px;">
              {competency.code}
            </span>
            <span style="font-size: 0.75rem; font-weight: 700; color: #64748b;">
              Oracle Kelas {competency.oracleClass}
            </span>
          </div>
          <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a;">
            {competency.title}
          </h3>
        </div>

        <button
          onclick={onClose}
          class="fl-btn fl-btn-sm"
          style="border: none; background: #f1f5f9; width: 36px; height: 36px; min-height: 36px; border-radius: 8px; color: #64748b; padding: 0;"
          aria-label="Tutup modal"
        >
          <Icon name="xmark" size={16} />
        </button>
      </div>

      <!-- Body -->
      <div style="padding: 20px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;">
        {#if isLoading}
          <div style="text-align: center; padding: 36px; color: #94a3b8; font-weight: 500;">
            Memuat tugas evaluasi...
          </div>
        {:else if tasks.length === 0}
          <div style="text-align: center; padding: 36px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
            <p style="margin: 0; color: #64748b; font-weight: 600; font-size: 0.9rem;">
              Belum ada tugas Oracle yang terdaftar untuk kompetensi ini.
            </p>
          </div>
        {:else if currentTask}
          <!-- Task Selector if multiple -->
          {#if tasks.length > 1}
            <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch;">
              {#each tasks as t, idx}
                <button
                  onclick={() => (selectedTaskId = t.id)}
                  class="fl-btn fl-btn-sm fl-pill-btn"
                  style="border: none; font-size: 0.8rem; font-weight: 700; background: {selectedTaskId === t.id ? '#0f766e' : '#f1f5f9'}; color: {selectedTaskId === t.id ? '#ffffff' : '#64748b'};"
                >
                  <span>Tugas {idx + 1}</span>
                </button>
              {/each}
            </div>
          {/if}

          <TaskExecutionForm
            task={currentTask}
            oracleClass={competency.oracleClass}
            onAttemptSubmitted={handleAttemptSubmitted}
          />
        {/if}
      </div>
    </div>
  </div>
{/if}
