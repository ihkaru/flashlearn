<script lang="ts">
  import type { SocraticTutorResponse } from '@flashlearn/shared';
  import { api } from '../../stores/api';
  import { lumisChat } from '../../stores/lumisChat.svelte';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    taskId: string;
    scenario?: string;
    taskTitle?: string;
  }

  let { taskId, scenario = '', taskTitle = 'Tugas Operasional' }: Props = $props();

  let isOpen = $state(false);
  let question = $state('');
  let isLoading = $state(false);
  let tutorResponse = $state<SocraticTutorResponse | null>(null);
  let errorMessage = $state<string | null>(null);

  async function handleAsk() {
    if (!question.trim()) return;
    isLoading = true;
    errorMessage = null;

    try {
      const res = await api.tasks.askSocraticHint(taskId, question.trim());
      tutorResponse = res;
      question = '';
    } catch (err: any) {
      errorMessage = err.message || 'Gagal berkonsultasi dengan Tutor Sokratik.';
    } finally {
      isLoading = false;
    }
  }
</script>

<div style="border-radius: 12px; border: 1px solid #e0e7ff; background: #f5f7ff; padding: 12px 14px; margin-top: 4px;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="background: #4f46e5; color: #ffffff; width: 24px; height: 24px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem;">
        <Icon name="chat" size={13} />
      </span>
      <div>
        <div style="font-weight: 700; font-size: 0.85rem; color: #1e1b4b;">Tutor Sokratik (Anti-Bocoran)</div>
        <div style="font-size: 0.72rem; color: #6366f1;">Panduan reflektif berbasis pasal resmi tanpa spoiler kunci jawaban</div>
      </div>
    </div>
    <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
      <button
        onclick={() => lumisChat.askSocraticTutor({ taskId, taskTitle, scenario })}
        class="fl-btn fl-btn-sm"
        style="border: none; background: #4f46e5; color: #ffffff; font-size: 0.75rem; font-weight: 700;"
      >
        <Icon name="chat" size={12} />
        <span>Chat Interaktif (AI Tutor)</span>
      </button>
      <button
        onclick={() => (isOpen = !isOpen)}
        class="fl-btn fl-btn-sm"
        style="border: none; background: #e0e7ff; color: #3730a3; font-size: 0.75rem; font-weight: 700;"
      >
        <span>{isOpen ? 'Tutup' : 'Hint Cepat'}</span>
      </button>
    </div>
  </div>

  {#if isOpen}
    <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 10px; border-top: 1px solid #e0e7ff; padding-top: 10px;">
      <div style="display: flex; gap: 8px;">
        <input
          type="text"
          placeholder="Misal: Saya bingung batas maksimum overhead yang diperbolehkan..."
          bind:value={question}
          onkeydown={(e) => e.key === 'Enter' && handleAsk()}
          disabled={isLoading}
          style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.82rem; background: #ffffff;"
        />
        <button
          onclick={handleAsk}
          disabled={isLoading || !question.trim()}
          class="fl-btn fl-btn-sm"
          style="background: #4f46e5; color: #ffffff; border: none; font-weight: 700; font-size: 0.8rem;"
        >
          <span>{isLoading ? 'Menelaah...' : 'Tanya'}</span>
        </button>
      </div>

      {#if errorMessage}
        <div style="font-size: 0.78rem; color: #b91c1c; background: #fef2f2; padding: 8px 10px; border-radius: 6px;">
          {errorMessage}
        </div>
      {/if}

      {#if tutorResponse}
        <div style="background: #ffffff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
          <!-- Guidance -->
          <div style="font-size: 0.85rem; color: #1e1b4b; line-height: 1.45;">
            {tutorResponse.socraticGuidance}
          </div>

          <!-- Reflective Question -->
          {#if tutorResponse.reflectiveQuestion}
            <div style="background: #eef2ff; border-left: 3px solid #6366f1; padding: 8px 10px; border-radius: 4px; font-size: 0.82rem; color: #3730a3; font-weight: 600;">
              💡 <em>{tutorResponse.reflectiveQuestion}</em>
            </div>
          {/if}

          <!-- Citations -->
          {#if tutorResponse.citationReferences && tutorResponse.citationReferences.length > 0}
            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 2px;">
              <span style="font-size: 0.72rem; font-weight: 700; color: #4338ca; text-transform: uppercase;">
                Rujukan Dokumen Resmi:
              </span>
              {#each tutorResponse.citationReferences as cite}
                <div style="font-size: 0.78rem; color: #475569; display: flex; align-items: baseline; gap: 6px;">
                  <span style="font-family: monospace; font-size: 0.72rem; background: #e0e7ff; color: #3730a3; padding: 1px 5px; border-radius: 4px; font-weight: 700;">
                    {cite.sourceCode} · {cite.locationTag}
                  </span>
                  <span>{cite.relevantPrinciple}</span>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Suggested Action -->
          {#if tutorResponse.suggestedAction}
            <div style="font-size: 0.78rem; color: #475569; border-top: 1px dashed #e2e8f0; padding-top: 6px;">
              <strong>Saran Aksi:</strong> {tutorResponse.suggestedAction}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
