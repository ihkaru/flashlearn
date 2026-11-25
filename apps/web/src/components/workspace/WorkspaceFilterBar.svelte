<script lang="ts">
  interface Props {
    activeFilter: string;
    totalCount: number;
    interactiveCount: number;
    materiCount: number;
    quizCount: number;
    deletedCount: number;
    distinctActiveTypeCount: number;
    isOwner: boolean;
    onSelect: (filter: string) => void;
  }

  let {
    activeFilter,
    totalCount,
    interactiveCount,
    materiCount,
    quizCount,
    deletedCount,
    distinctActiveTypeCount,
    isOwner,
    onSelect,
  }: Props = $props();

  function pillStyle(key: string): string {
    const active = activeFilter === key;
    return `border: 1px solid ${active ? 'var(--ws-accent, #0f766e)' : '#e2e8f0'}; background: ${active ? 'var(--ws-accent, #0f766e)' : '#ffffff'}; color: ${active ? '#ffffff' : '#475569'};`;
  }
</script>

<div class="fl-scroll-row" style="margin-bottom: 18px;">
  <button
    onclick={() => onSelect('all')}
    class="fl-btn fl-btn-sm fl-pill-btn"
    style={pillStyle('all')}
  >
    <span>Semua ({totalCount})</span>
  </button>

  {#if distinctActiveTypeCount >= 2 && interactiveCount > 0}
    <button
      onclick={() => onSelect('interactive_module')}
      class="fl-btn fl-btn-sm fl-pill-btn"
      style={pillStyle('interactive_module')}
    >
      <span>Interaktif ({interactiveCount})</span>
    </button>
  {/if}

  {#if distinctActiveTypeCount >= 2 && materiCount > 0}
    <button
      onclick={() => onSelect('materi')}
      class="fl-btn fl-btn-sm fl-pill-btn"
      style={pillStyle('materi')}
    >
      <span>Materi ({materiCount})</span>
    </button>
  {/if}

  {#if distinctActiveTypeCount >= 2 && quizCount > 0}
    <button
      onclick={() => onSelect('quiz')}
      class="fl-btn fl-btn-sm fl-pill-btn"
      style={pillStyle('quiz')}
    >
      <span>Kuis ({quizCount})</span>
    </button>
  {/if}

  {#if isOwner && deletedCount > 0}
    <button
      onclick={() => onSelect('trash')}
      class="fl-btn fl-btn-sm fl-pill-btn"
      style="border: 1px solid {activeFilter === 'trash' ? '#e11d48' : '#fecdd3'}; background: {activeFilter === 'trash' ? '#e11d48' : '#fff1f2'}; color: {activeFilter === 'trash' ? '#ffffff' : '#be123c'}; margin-left: auto;"
    >
      <span>Arsip ({deletedCount})</span>
    </button>
  {/if}
</div>
