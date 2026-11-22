<script lang="ts">
  import { buildSandboxedDeckHtml, type SlideNoteItem } from '@flashlearn/shared';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    rawHtml: string;
    slideIndex: number;
    slideNotes?: SlideNoteItem[];
    isFullscreen: boolean;
    onSlideChange: (index: number, total: number) => void;
    onToggleFullscreen: () => void;
  }

  let {
    rawHtml,
    slideIndex,
    slideNotes = [],
    isFullscreen,
    onSlideChange,
    onToggleFullscreen,
  }: Props = $props();

  let iframeEl = $state<HTMLIFrameElement | null>(null);
  let totalSlides = $state(slideNotes.length || 1);
  let showNotes = $state(false);
  let lowPower = $state(typeof window !== 'undefined' ? window.innerWidth <= 900 : true);
  let lastPushedSlide = -1;

  // Build sandboxed srcdoc ONCE per rawHtml so rotating or changing steps NEVER reloads iframe
  const initialIndexSnapshot = slideIndex;
  const srcdoc = $derived(
    buildSandboxedDeckHtml(rawHtml, {
      initialSlide: initialIndexSnapshot,
      forceLowPower: lowPower,
      hideInternalChrome: true,
    })
  );

  const activeNote = $derived(
    slideNotes.find((n) => n.index === slideIndex) || slideNotes[slideIndex] || null
  );

  $effect(() => {
    function handleDeckMessage(e: MessageEvent) {
      if (!iframeEl || e.source !== iframeEl.contentWindow) return;
      const d = e.data;
      if (!d || d.__flashlearnDeck !== 1 || d.type !== 'state') return;
      if (typeof d.total === 'number' && d.total > 0) totalSlides = d.total;
      if (typeof d.index === 'number' && d.index !== slideIndex) {
        lastPushedSlide = d.index;
        onSlideChange(d.index, totalSlides);
      }
    }
    window.addEventListener('message', handleDeckMessage);
    return () => window.removeEventListener('message', handleDeckMessage);
  });

  $effect(() => {
    if (!iframeEl?.contentWindow) return;
    if (slideIndex === lastPushedSlide) return;
    lastPushedSlide = slideIndex;
    iframeEl.contentWindow.postMessage({ __flashlearnDeck: 1, type: 'goto', index: slideIndex }, '*');
  });

  function stepSlide(delta: number) {
    const next = Math.max(0, Math.min(totalSlides - 1, slideIndex + delta));
    if (next !== slideIndex) {
      onSlideChange(next, totalSlides);
    }
  }
</script>

<div
  class={isFullscreen ? 'fl-deck-fullscreen' : 'fl-deck-inline'}
  style={isFullscreen
    ? 'position: fixed; inset: 0; z-index: 950; background: #0f172a; display: flex; flex-direction: column;'
    : 'background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;'}
>
  <div
    style={isFullscreen
      ? 'flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; background: #0f172a;'
      : 'width: 100%; aspect-ratio: 16 / 9; background: #0f172a; position: relative;'}
  >
    <iframe
      bind:this={iframeEl}
      title="Slide visual pembelajaran"
      {srcdoc}
      sandbox="allow-scripts"
      style={isFullscreen
        ? 'width: 100%; height: 100%; max-width: calc(100dvh * 16 / 9); aspect-ratio: 16 / 9; border: 0;'
        : 'width: 100%; height: 100%; border: 0; display: block;'}
    ></iframe>
  </div>

  <!-- Minimal, calm controls bar -->
  <div
    style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; background: {isFullscreen ? '#1e293b' : '#f8fafc'}; border-top: 1px solid {isFullscreen ? '#334155' : '#e2e8f0'}; color: {isFullscreen ? '#f8fafc' : '#334155'};"
  >
    <div style="display: flex; align-items: center; gap: 6px;">
      <button
        type="button"
        disabled={slideIndex <= 0}
        onclick={() => stepSlide(-1)}
        class="fl-btn fl-btn-sm"
        style="background: {isFullscreen ? '#334155' : '#ffffff'}; color: {isFullscreen ? '#f8fafc' : '#0f172a'}; border: 1px solid {isFullscreen ? '#475569' : '#cbd5e1'}; padding: 6px 10px;"
        aria-label="Slide sebelumnya"
      >
        <Icon name="arrow-left" size={14} />
      </button>

      <span style="font-size: 0.8rem; font-weight: 700; min-width: 52px; text-align: center;">
        {slideIndex + 1} / {totalSlides}
      </span>

      <button
        type="button"
        disabled={slideIndex >= totalSlides - 1}
        onclick={() => stepSlide(1)}
        class="fl-btn fl-btn-sm"
        style="background: {isFullscreen ? '#334155' : '#ffffff'}; color: {isFullscreen ? '#f8fafc' : '#0f172a'}; border: 1px solid {isFullscreen ? '#475569' : '#cbd5e1'}; padding: 6px 10px;"
        aria-label="Slide berikutnya"
      >
        <Icon name="arrow-right" size={14} />
      </button>
    </div>

    <div style="display: flex; align-items: center; gap: 6px;">
      {#if activeNote && (activeNote.purpose || activeNote.talk.length > 0)}
        <button
          type="button"
          onclick={() => (showNotes = !showNotes)}
          class="fl-btn fl-btn-sm"
          style="background: transparent; color: {isFullscreen ? '#99f6e4' : '#0f766e'}; border: 1px solid {isFullscreen ? '#475569' : '#cbd5e1'}; font-size: 0.78rem;"
        >
          {showNotes ? 'Tutup Catatan' : 'Catatan'}
        </button>
      {/if}

      <button
        type="button"
        onclick={onToggleFullscreen}
        class="fl-btn fl-btn-sm"
        style="background: {isFullscreen ? '#0f766e' : '#ffffff'}; color: {isFullscreen ? '#ffffff' : '#0f172a'}; border: 1px solid {isFullscreen ? '#0f766e' : '#cbd5e1'}; font-size: 0.78rem;"
      >
        {isFullscreen ? 'Kembali ke Panduan' : 'Layar Penuh'}
      </button>
    </div>
  </div>

  {#if showNotes && activeNote}
    <div style="padding: 12px 14px; background: {isFullscreen ? '#0f172a' : '#ffffff'}; color: {isFullscreen ? '#e2e8f0' : '#334155'}; border-top: 1px solid {isFullscreen ? '#334155' : '#e2e8f0'}; max-height: 160px; overflow-y: auto; font-size: 0.84rem; line-height: 1.5;">
      {#if activeNote.purpose}
        <p style="margin: 0 0 6px 0; font-weight: 700; color: {isFullscreen ? '#99f6e4' : '#0f766e'};">
          {activeNote.purpose}
        </p>
      {/if}
      {#if activeNote.talk.length > 0}
        <ul style="margin: 0; padding-left: 18px;">
          {#each activeNote.talk as point}
            <li>{point}</li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>
