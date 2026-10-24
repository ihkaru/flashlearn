<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { lumisChat } from '../../stores/lumisChat.svelte';
  import Icon from '../ui/Icon.svelte';

  let iframeElement = $state<HTMLIFrameElement | null>(null);
  let isIframeReady = $state(false);

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

  const iframeSrc = $derived.by(() => {
    if (typeof window === 'undefined') return '';
    const origin = encodeURIComponent(window.location.origin);
    const title = encodeURIComponent('FlashLearn AI Tutor');
    return `${lumisChat.serverUrl}/embed/chat?title=${title}&origin=${origin}&theme=light`;
  });

  function handleMessage(event: MessageEvent) {
    if (typeof window === 'undefined') return;
    try {
      const serverOrigin = new URL(lumisChat.serverUrl).origin;
      if (event.origin !== serverOrigin) return;
    } catch {
      return;
    }

    const data = event.data;
    if (!data || data.source !== 'lumis-widget') return;

    if (data.event === 'lumis:ready') {
      isIframeReady = true;
      syncContextToIframe();
    }
  }

  function syncContextToIframe() {
    if (!iframeElement?.contentWindow || !isIframeReady) return;

    const serverOrigin = new URL(lumisChat.serverUrl).origin;
    iframeElement.contentWindow.postMessage(
      {
        source: 'host-app',
        event: 'lumis:init',
        payload: {
          context: lumisChat.context,
        },
      },
      serverOrigin
    );

    if (lumisChat.pendingPrompt) {
      sendPromptToIframe(lumisChat.pendingPrompt);
      lumisChat.pendingPrompt = '';
    }
  }

  function sendPromptToIframe(promptText: string) {
    if (!iframeElement?.contentWindow) return;
    const serverOrigin = new URL(lumisChat.serverUrl).origin;
    iframeElement.contentWindow.postMessage(
      {
        source: 'host-app',
        event: 'lumis:send_prompt',
        payload: { prompt: promptText },
      },
      serverOrigin
    );
  }

  $effect(() => {
    if (lumisChat.isOpen && isIframeReady && lumisChat.pendingPrompt) {
      sendPromptToIframe(lumisChat.pendingPrompt);
      lumisChat.pendingPrompt = '';
    }
  });

  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleMessage);
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handleMessage);
    }
  });
</script>

<!-- Floating Chat Assistant Container -->
<div
  style="position: fixed; bottom: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; align-items: flex-end; pointer-events: none;"
>
  {#if lumisChat.isOpen}
    <!-- Expanded Floating Window -->
    <div
      role="dialog"
      aria-modal="false"
      tabindex="-1"
      onkeydown={(e) => e.key === 'Escape' && lumisChat.close()}
      style="pointer-events: auto; width: 440px; max-width: calc(100vw - 32px); height: 620px; max-height: calc(100dvh - 90px); background: #ffffff; border-radius: 20px; border: 1px solid #cbd5e1; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); display: flex; flex-direction: column; overflow: hidden; margin-bottom: 12px; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;"
    >
      <!-- Chat Header -->
      <div
        style="padding: 12px 16px; background: #0f766e; color: #ffffff; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15);"
      >
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;">
            <Icon name="bolt" size={16} />
          </div>
          <div>
            <div style="font-size: 0.88rem; font-weight: 800; line-height: 1.2;">FlashLearn AI Tutor</div>
            <div style="font-size: 0.72rem; opacity: 0.9; display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 3px; background: #34d399;"></span>
              <span>Lumis In-App Engine</span>
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 6px;">
          <button
            onclick={() => lumisChat.close()}
            aria-label="Tutup Chat"
            style="border: none; background: rgba(255,255,255,0.2); width: 28px; height: 28px; border-radius: 6px; color: #ffffff; display: flex; align-items: center; justify-content: center; cursor: pointer;"
          >
            <Icon name="xmark" size={14} />
          </button>
        </div>
      </div>

      <!-- Context Subheader & Suggested Action Pills -->
      <div style="padding: 8px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.72rem; font-weight: 700; color: {phaseBadge.color}; background: {phaseBadge.bg}; padding: 2px 8px; border-radius: 6px;">
            {phaseBadge.label}
          </span>
          {#if lumisChat.context.competencyCode}
            <span style="font-family: monospace; font-size: 0.72rem; font-weight: 700; color: #64748b;">
              {lumisChat.context.competencyCode}
            </span>
          {/if}
        </div>

        <!-- Quick Action Prompt Pills -->
        <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px;">
          <button
            onclick={() => sendPromptToIframe('Berikan pertanyaan pemantik sokratik tanpa membocorkan kunci jawaban.')}
            style="white-space: nowrap; font-size: 0.72rem; font-weight: 600; background: #ffffff; border: 1px solid #cbd5e1; color: #334155; padding: 4px 8px; border-radius: 6px; cursor: pointer;"
          >
            💡 Hint Sokratik
          </button>
          <button
            onclick={() => sendPromptToIframe('Apa rujukan pasal atau dokumen standar resmi untuk skenario ini?')}
            style="white-space: nowrap; font-size: 0.72rem; font-weight: 600; background: #ffffff; border: 1px solid #cbd5e1; color: #334155; padding: 4px 8px; border-radius: 6px; cursor: pointer;"
          >
            📜 Rujukan Regulasi
          </button>
          <button
            onclick={() => sendPromptToIframe('Mengapa kompromi terhadap syarat ini berisiko fatal?')}
            style="white-space: nowrap; font-size: 0.72rem; font-weight: 600; background: #ffffff; border: 1px solid #cbd5e1; color: #334155; padding: 4px 8px; border-radius: 6px; cursor: pointer;"
          >
            ⚠️ Analisis Risiko
          </button>
        </div>
      </div>

      <!-- Isolated Lumis Embed Iframe Viewport -->
      <div style="flex: 1; position: relative; background: #fdfdfd;">
        {#if iframeSrc}
          <iframe
            bind:this={iframeElement}
            src={iframeSrc}
            title="Lumis Chat Assistant"
            allow="clipboard-write"
            style="width: 100%; height: 100%; border: none; display: block;"
          ></iframe>
        {/if}
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
