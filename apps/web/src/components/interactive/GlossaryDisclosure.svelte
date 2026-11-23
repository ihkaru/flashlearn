<script lang="ts">
  import type { GlossaryTerm, GuidedLearningStep, ModuleFigure } from '@flashlearn/shared';
  import { resolveAssetUrl } from '../../lib/resolveAssetUrl';
  import FigureLightboxModal from './FigureLightboxModal.svelte';

  interface Props {
    glossary?: GlossaryTerm[];
    citations?: Array<{ sourceRef: string; locationTag: string; verbatimQuote?: string }>;
    figures?: ModuleFigure[];
    steps?: GuidedLearningStep[];
  }

  let { glossary = [], citations = [], figures = [], steps = [] }: Props = $props();

  let openPanel = $state<'none' | 'glossary' | 'citations' | 'figures'>('none');
  let selectedTerm = $state<GlossaryTerm | null>(null);
  let zoomedFigure = $state<ModuleFigure | null>(null);

  function togglePanel(target: 'glossary' | 'citations' | 'figures') {
    openPanel = openPanel === target ? 'none' : target;
  }

  function findStepBadge(fig: ModuleFigure): string {
    const matched = fig.stepId
      ? steps.find((s) => s.id === fig.stepId)
      : steps.find((s) => s.kind === fig.stepKind);
    return matched ? `Langkah ${matched.stepNumber}` : 'Lampiran';
  }
</script>

{#if glossary.length > 0 || citations.length > 0 || figures.length > 0}
  <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #f1f5f9;">
    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      {#if figures.length > 0}
        <button
          type="button"
          onclick={() => togglePanel('figures')}
          class="fl-btn fl-btn-sm"
          style="background: {openPanel === 'figures' ? '#f0fdfa' : '#f8fafc'}; color: {openPanel === 'figures' ? '#0f766e' : '#0f766e'}; border: 1px solid {openPanel === 'figures' ? '#5eead4' : '#99f6e4'}; font-size: 0.78rem; font-weight: 700;"
        >
          Ilustrasi &amp; Diagram ({figures.length})
        </button>
      {/if}
      {#if glossary.length > 0}
        <button
          type="button"
          onclick={() => togglePanel('glossary')}
          class="fl-btn fl-btn-sm"
          style="background: {openPanel === 'glossary' ? '#f0fdfa' : '#f8fafc'}; color: {openPanel === 'glossary' ? '#0f766e' : '#475569'}; border: 1px solid {openPanel === 'glossary' ? '#99f6e4' : '#e2e8f0'}; font-size: 0.78rem;"
        >
          Istilah Kunci ({glossary.length})
        </button>
      {/if}
      {#if citations.length > 0}
        <button
          type="button"
          onclick={() => togglePanel('citations')}
          class="fl-btn fl-btn-sm"
          style="background: {openPanel === 'citations' ? '#f0fdfa' : '#f8fafc'}; color: {openPanel === 'citations' ? '#0f766e' : '#475569'}; border: 1px solid {openPanel === 'citations' ? '#99f6e4' : '#e2e8f0'}; font-size: 0.78rem;"
        >
          Rujukan Sumber ({citations.length})
        </button>
      {/if}
    </div>

    {#if openPanel === 'figures'}
      <div style="margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px;">
        {#each figures as fig (fig.id)}
          <button
            type="button"
            onclick={() => (zoomedFigure = fig)}
            style="text-align: left; padding: 10px; border-radius: 12px; background: #f8fafc; border: 1px solid #cbd5e1; cursor: zoom-in; display: flex; flex-direction: column; gap: 8px;"
          >
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; width: 100%;">
              <span style="font-size: 0.7rem; font-weight: 800; color: #0f766e; background: #ccfbf1; padding: 2px 7px; border-radius: 999px;">
                {findStepBadge(fig)}{#if fig.sourcePage} · Hal. {fig.sourcePage}{/if}
              </span>
              <span style="font-size: 0.72rem; font-weight: 700; color: #475569;">Perbesar</span>
            </div>
            <img
              src={resolveAssetUrl(fig.assetUrl)}
              alt={fig.altText}
              loading="lazy"
              decoding="async"
              style="width: 100%; height: 128px; object-fit: contain; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4px; box-sizing: border-box;"
            />
            <div style="font-size: 0.8rem; font-weight: 700; color: #0f172a; line-height: 1.4;">
              {fig.caption}
            </div>
          </button>
        {/each}
      </div>
    {:else if openPanel === 'glossary'}
      <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          {#each glossary as item (item.term)}
            <button
              type="button"
              onclick={() => (selectedTerm = selectedTerm?.term === item.term ? null : item)}
              class="fl-btn fl-btn-sm"
              style="background: {selectedTerm?.term === item.term ? '#0f766e' : '#ffffff'}; color: {selectedTerm?.term === item.term ? '#ffffff' : '#334155'}; border: 1px solid #cbd5e1; font-size: 0.8rem;"
            >
              {item.term}
            </button>
          {/each}
        </div>
        {#if selectedTerm}
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; font-size: 0.85rem; line-height: 1.5; color: #334155;">
            <strong style="color: #0f172a;">{selectedTerm.term}:</strong> {selectedTerm.definition}
            {#if selectedTerm.highSchoolAnchor}
              <div style="margin-top: 6px; color: #0f766e; font-size: 0.82rem;">
                Padanan sederhana: {selectedTerm.highSchoolAnchor}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {:else if openPanel === 'citations'}
      <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
        {#each citations as cit}
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 0.82rem; color: #334155; line-height: 1.45;">
            <div style="font-weight: 700; color: #0f766e; margin-bottom: 3px;">
              {cit.sourceRef} ({cit.locationTag})
            </div>
            {#if cit.verbatimQuote}
              <div>{cit.verbatimQuote}</div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<FigureLightboxModal figure={zoomedFigure} onClose={() => (zoomedFigure = null)} />
