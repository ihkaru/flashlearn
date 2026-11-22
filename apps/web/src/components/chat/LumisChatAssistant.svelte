<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { lumisChat } from '../../stores/lumisChat.svelte';
  import Icon from '../ui/Icon.svelte';

  let inputPrompt = $state('');
  let messagesContainer = $state<HTMLDivElement | null>(null);

  const phaseBadge = $derived.by(() => {
    switch (lumisChat.context.phase) {
      case 'socratic_tutor':
        return { label: 'Tutor Sokratik (Anti-Spoiler)', color: '#4f46e5', bg: '#eef2ff' };
      case 'adversarial_debrief':
        return { label: 'Debrief Dilemma Integritas', color: '#b45309', bg: '#fef3c7' };
      case 'diagnostic_guide':
        return { label: 'Panduan Diagnostik KST', color: '#0f766e', bg: '#ccfbf1' };
      case 'drift_revalidation':
        return { label: 'Refresing Retrievabilitas DSR', color: '#dc2626', bg: '#fee2e2' };
      default:
        return { label: 'Asisten Belajar FlashLearn', color: '#0f766e', bg: '#f0fdf4' };
    }
  });

  async function scrollToBottom() {
    await tick();
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  $effect(() => {
    if (lumisChat.messages.length > 0 || lumisChat.isThinking) {
      scrollToBottom();
    }
  });

  async function handleSend() {
    const text = inputPrompt.trim();
    if (!text || lumisChat.isThinking) return;
    inputPrompt = '';
    await lumisChat.sendMessage(text);
    await scrollToBottom();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
</script>

<!-- Floating Chat Assistant Container -->
<div
  style="position: fixed; bottom: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; align-items: flex-end; pointer-events: none;"
>
  {#if lumisChat.isOpen}
    <!-- Expanded Floating Window (Native Svelte, Zero Cross-Origin Iframe) -->
    <div
      role="dialog"
      aria-modal="false"
      tabindex="-1"
      onkeydown={(e) => e.key === 'Escape' && lumisChat.close()}
      style="pointer-events: auto; width: 440px; max-width: calc(100vw - 32px); height: 600px; max-height: calc(100dvh - 90px); background: #ffffff; border-radius: 20px; border: 1px solid #cbd5e1; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); display: flex; flex-direction: column; overflow: hidden; margin-bottom: 12px; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;"
    >
      <!-- Chat Header -->
      <div
        style="padding: 12px 16px; background: #0f766e; color: #ffffff; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15);"
      >
        <div>
          <div style="font-size: 0.9rem; font-weight: 800; line-height: 1.2;">FlashLearn Socratic AI</div>
          <div style="font-size: 0.74rem; color: #ccfbf1;">
            Terisolasi &amp; Anti-Bocoran
          </div>
        </div>

        <button
          onclick={() => lumisChat.close()}
          aria-label="Tutup Chat"
          style="border: none; background: rgba(255,255,255,0.2); width: 32px; height: 32px; border-radius: 8px; color: #ffffff; display: flex; align-items: center; justify-content: center;"
        >
          <Icon name="xmark" size={15} />
        </button>
      </div>

      <!-- Context Subheader & Suggested Action Pills -->
      <div style="padding: 8px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
          <span style="font-size: 0.74rem; font-weight: 700; color: {phaseBadge.color}; background: {phaseBadge.bg}; padding: 2px 8px; border-radius: 6px;">
            {phaseBadge.label}
          </span>
          {#if lumisChat.context.competencyCode}
            <span style="font-family: monospace; font-size: 0.72rem; font-weight: 700; color: #475569;">
              {lumisChat.context.competencyCode}
            </span>
          {/if}
        </div>

        <!-- Quick Action Prompt Pills -->
        <div class="fl-scroll-row" style="gap: 6px;">
          {#if lumisChat.lastAdoptedDraft}
            <button
              onclick={() => lumisChat.adoptDraft(lumisChat.lastAdoptedDraft)}
              class="fl-btn fl-btn-sm fl-pill-btn"
              style="font-size: 0.74rem; font-weight: 700; background: #e0f2fe; border: 1px solid #7dd3fc; color: #0369a1; min-height: 32px; padding: 4px 10px;"
            >
              Terapkan ke Form Tugas
            </button>
          {/if}
          <button
            onclick={() => lumisChat.sendMessage('Berikan pertanyaan pemantik sokratik tanpa membocorkan kunci jawaban.')}
            class="fl-btn fl-btn-sm fl-pill-btn"
            style="font-size: 0.74rem; font-weight: 600; background: #ffffff; border: 1px solid #cbd5e1; color: #334155; min-height: 32px; padding: 4px 10px;"
          >
            Hint Sokratik
          </button>
          <button
            onclick={() => lumisChat.sendMessage('Apa rujukan pasal atau dokumen standar resmi untuk skenario ini?')}
            class="fl-btn fl-btn-sm fl-pill-btn"
            style="font-size: 0.74rem; font-weight: 600; background: #ffffff; border: 1px solid #cbd5e1; color: #334155; min-height: 32px; padding: 4px 10px;"
          >
            Rujukan Regulasi
          </button>
          <button
            onclick={() => lumisChat.sendMessage('Mengapa kompromi terhadap syarat ini berisiko fatal?')}
            class="fl-btn fl-btn-sm fl-pill-btn"
            style="font-size: 0.74rem; font-weight: 600; background: #ffffff; border: 1px solid #cbd5e1; color: #334155; min-height: 32px; padding: 4px 10px;"
          >
            Analisis Risiko
          </button>
        </div>
      </div>

      <!-- Native Message Viewport -->
      <div
        bind:this={messagesContainer}
        style="flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px; background: #fdfdfd;"
      >
        {#if lumisChat.messages.length === 0}
          <div style="text-align: center; padding: 36px 16px; color: #475569; font-size: 0.85rem;">
            <div style="font-weight: 800; color: #0f172a; margin-bottom: 6px; font-size: 0.95rem;">Tutor Sokratik Siap Membimbing</div>
            <div style="font-size: 0.82rem; line-height: 1.55; max-width: 300px; margin: 0 auto;">
              Ajukan pertanyaan mengenai skenario atau rujukan regulasi. Tutor memandu penalaran Anda tanpa mengungkap kunci jawaban.
            </div>
          </div>
        {:else}
          {#each lumisChat.messages as m}
            <div
              style="display: flex; flex-direction: column; align-items: {m.role === 'user' ? 'flex-end' : 'flex-start'}; max-width: 100%;"
            >
              <div
                class="fl-prose"
                style="max-width: 86%; border-radius: {m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px'}; padding: 10px 14px; font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap; background: {m.role === 'user' ? '#0f766e' : '#ffffff'}; color: {m.role === 'user' ? '#ffffff' : '#1e293b'}; border: {m.role === 'user' ? 'none' : '1px solid #e2e8f0'};"
              >
                {m.content}
              </div>
              <span style="font-size: 0.7rem; color: #64748b; margin-top: 3px; padding: 0 4px;">
                {m.role === 'user' ? 'Anda' : 'Tutor Sokratik'}
              </span>
            </div>
          {/each}
        {/if}

        {#if lumisChat.isThinking}
          <div style="padding: 8px 12px; background: #f1f5f9; border-radius: 10px; width: fit-content; font-size: 0.8rem; color: #475569; font-weight: 600;">
            Menelaah klausul naskah rujukan...
          </div>
        {/if}
      </div>

      <!-- Native Chat Input Bar -->
      <div style="padding: 10px 12px; border-top: 1px solid #e2e8f0; background: #ffffff; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <input
            type="text"
            placeholder="Tanyakan konsep, dasar pasal, atau kalkulasi..."
            bind:value={inputPrompt}
            onkeydown={handleKeyDown}
            disabled={lumisChat.isThinking}
            style="flex: 1; min-width: 0; padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 0.86rem; background: #f8fafc; min-height: 40px;"
          />
          <button
            onclick={handleSend}
            disabled={lumisChat.isThinking || !inputPrompt.trim()}
            aria-label="Kirim Pesan"
            class="fl-btn fl-btn-sm"
            style="background: #0f766e; color: #ffffff; border: none; min-height: 40px; padding: 0 14px;"
          >
            Kirim
          </button>
        </div>
        <div style="font-size: 0.7rem; color: #64748b; text-align: center;">
          Terisolasi ke sesi FlashLearn Anda · Anti-Bocoran Kunci Jawaban
        </div>
      </div>
    </div>
  {/if}

  <!-- Floating Action Button (FAB) -->
  <button
    type="button"
    onclick={() => lumisChat.toggle()}
    aria-label="Buka AI Learning Assistant"
    style="pointer-events: auto; width: 56px; height: 56px; border-radius: 28px; background: #0f766e; color: #ffffff; border: none; box-shadow: 0 10px 25px -5px rgba(15, 118, 110, 0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); min-width: 56px; min-height: 56px;"
  >
    {#if lumisChat.isOpen}
      <Icon name="xmark" size={22} />
    {:else}
      <Icon name="chat" size={24} />
    {/if}
  </button>
</div>
