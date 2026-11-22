<script lang="ts">
  import type { CompetencyCorpusChunk } from '@flashlearn/shared';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    chunks?: CompetencyCorpusChunk[];
    taskTitle?: string;
    scenario?: string;
    oracleClass?: string;
  }

  let { chunks = [], taskTitle = '', scenario = '', oracleClass = 'A' }: Props = $props();

  let isExpanded = $state(true);
  let selectedChunkId = $state<string>('recommended');

  let recommendedChunk = $derived.by(() => {
    if (chunks.length === 0) return null;
    const queryWords = `${taskTitle} ${scenario}`
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);

    let best = chunks[0];
    let bestScore = -1;
    for (const chunk of chunks) {
      const haystack = `${chunk.locationTag} ${chunk.content}`.toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (haystack.includes(word)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = chunk;
      }
    }
    return best;
  });

  let activeChunk = $derived.by(() => {
    if (chunks.length === 0) return null;
    if (selectedChunkId === 'recommended') return recommendedChunk;
    return chunks.find((c) => c.id === selectedChunkId) || chunks[0];
  });

  let primarySourceCode = $derived(activeChunk?.sourceCode || chunks[0]?.sourceCode || 'CORPUS');
</script>

<div
  style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.03);"
>
  <div
    style="padding: 12px 16px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); display: flex; justify-content: space-between; align-items: center; border-bottom: {isExpanded ? '1px solid #bbf7d0' : 'none'};"
  >
    <div style="display: flex; align-items: center; gap: 8px;">
      <span
        style="width: 26px; height: 26px; border-radius: 7px; background: #0f766e; color: #ffffff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;"
      >
        <Icon name="book-open" size={14} />
      </span>
      <div>
        <div style="font-size: 0.86rem; font-weight: 800; color: #064e3b; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span>Dokumen Acuan Resmi (Corpus of Record)</span>
          <span style="font-size: 0.7rem; font-weight: 700; background: #bbf7d0; color: #14532d; padding: 1px 6px; border-radius: 4px;">
            {primarySourceCode}
          </span>
        </div>
        <div style="font-size: 0.72rem; color: #047857;">
          Rujukan terverifikasi dari basis data domain untuk Oracle Kelas {oracleClass}.
        </div>
      </div>
    </div>

    <button
      type="button"
      onclick={() => (isExpanded = !isExpanded)}
      class="fl-btn fl-btn-sm"
      style="border: 1px solid #bbf7d0; background: #ffffff; color: #0f766e; font-size: 0.76rem; font-weight: 700;"
    >
      <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={12} />
      <span>{isExpanded ? 'Sembunyikan' : 'Buka Rujukan'}</span>
    </button>
  </div>

  {#if isExpanded}
    <div style="padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;">
      {#if chunks.length === 0 || !activeChunk}
        <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 12px 14px; font-size: 0.8rem; color: #64748b;">
          Belum ada naskah Corpus of Record tertaut ke kompetensi ini. Impor sumber dokumen resmi melalui CLI (`flashlearn source ingest`).
        </div>
      {:else}
        <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; -webkit-overflow-scrolling: touch;">
          <button
            type="button"
            onclick={() => (selectedChunkId = 'recommended')}
            class="fl-btn fl-btn-sm fl-pill-btn"
            style="font-size: 0.75rem; font-weight: 700; background: {selectedChunkId === 'recommended' ? '#0f766e' : '#ffffff'}; color: {selectedChunkId === 'recommended' ? '#ffffff' : '#334155'}; border: 1px solid {selectedChunkId === 'recommended' ? '#0f766e' : '#cbd5e1'};"
          >
            <Icon name="sparkles" size={12} />
            <span>Rujukan Tugas Ini</span>
          </button>
          {#each chunks as chk}
            <button
              type="button"
              onclick={() => (selectedChunkId = chk.id)}
              class="fl-btn fl-btn-sm fl-pill-btn"
              style="font-size: 0.75rem; font-weight: 700; background: {selectedChunkId === chk.id ? '#0f766e' : '#ffffff'}; color: {selectedChunkId === chk.id ? '#ffffff' : '#475569'}; border: 1px solid {selectedChunkId === chk.id ? '#0f766e' : '#e2e8f0'};"
            >
              {chk.locationTag}
            </button>
          {/each}
        </div>

        <div
          style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 14px; font-size: 0.82rem; color: #1e293b; line-height: 1.5;"
        >
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 6px; flex-wrap: wrap;">
            <div>
              <span style="font-weight: 800; font-size: 0.85rem; color: #0f766e;">
                {activeChunk.locationTag}
              </span>
              <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
                {activeChunk.sourceTitle}
              </div>
            </div>
            <span style="font-size: 0.68rem; color: #64748b; font-family: monospace; background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
              SHA-256: {activeChunk.sha256Hash.slice(0, 12)}...
            </span>
          </div>

          <div style="white-space: pre-line; max-height: 240px; overflow-y: auto;">
            {activeChunk.content}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
