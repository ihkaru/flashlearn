<script lang="ts">
  import { buildSandboxedDeckHtml } from '@flashlearn/shared';

  interface Props {
    htmlContent: string;
    title: string;
    onAhaReached: () => void;
  }

  let { htmlContent, title, onAhaReached }: Props = $props();
  let iframeEl = $state<HTMLIFrameElement | null>(null);
  let completed = $state(false);

  const srcdoc = $derived(
    buildSandboxedDeckHtml(htmlContent, { forceLowPower: true, hideInternalChrome: true })
  );

  $effect(() => {
    function handleMsg(e: MessageEvent) {
      if (!iframeEl || e.source !== iframeEl.contentWindow) return;
      if (e.data && e.data.type === 'flashlearn:sim:aha_reached' && !completed) {
        completed = true;
        onAhaReached();
      }
    }
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  });

  function confirmObserved() {
    if (!completed) {
      completed = true;
      onAhaReached();
    }
  }
</script>

<div style="display: flex; flex-direction: column; gap: 10px;">
  <div style="width: 100%; aspect-ratio: 16 / 10; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background: #ffffff;">
    <iframe
      bind:this={iframeEl}
      {title}
      {srcdoc}
      sandbox="allow-scripts"
      style="width: 100%; height: 100%; border: 0; display: block;"
    ></iframe>
  </div>

  {#if !completed}
    <button
      type="button"
      onclick={confirmObserved}
      class="fl-btn fl-btn-sm"
      style="align-self: flex-start; background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; font-weight: 700;"
    >
      Saya sudah mencoba simulasi ini
    </button>
  {/if}
</div>
