<script lang="ts">
  import type {
    GuidedLearningStep,
    InteractiveModulePayload,
    ModuleFigure,
  } from '@flashlearn/shared';
  import { resolveAssetUrl } from '../../lib/resolveAssetUrl';
  import FigureLightboxModal from './FigureLightboxModal.svelte';

  interface Props {
    payload: InteractiveModulePayload;
    step: GuidedLearningStep;
  }

  let { payload, step }: Props = $props();

  const matchingFigures = $derived(
    (payload.figures || []).filter((f) =>
      f.stepId ? f.stepId === step.id : f.stepKind === step.kind
    )
  );

  let zoomedFigure = $state<ModuleFigure | null>(null);
</script>

{#if matchingFigures.length > 0}
  <div
    style="display: grid; grid-template-columns: {matchingFigures.length > 1 ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr'}; gap: 12px;"
  >
    {#each matchingFigures as fig (fig.id)}
      <figure
        style="margin: 0; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column;"
      >
        <div
          style="padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;"
        >
          <span style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #0f766e;">
            Ilustrasi &amp; Diagram Sumber
            {#if fig.sourcePage}
              · Hal. {fig.sourcePage}
            {/if}
          </span>
          <button
            type="button"
            onclick={() => (zoomedFigure = fig)}
            class="fl-btn fl-btn-sm"
            style="min-height: 30px; padding: 4px 10px; font-size: 0.75rem; background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1;"
          >
            Perbesar
          </button>
        </div>

        <button
          type="button"
          onclick={() => (zoomedFigure = fig)}
          aria-label={`Perbesar gambar: ${fig.caption}`}
          style="display: block; width: 100%; padding: 12px; background: #ffffff; border: none; cursor: zoom-in; text-align: center;"
        >
          <img
            src={resolveAssetUrl(fig.assetUrl)}
            alt={fig.altText}
            loading="lazy"
            decoding="async"
            style="max-width: 100%; max-height: 420px; width: auto; height: auto; border-radius: 8px; object-fit: contain; display: block; margin: 0 auto;"
          />
        </button>

        <figcaption style="padding: 12px 14px; border-top: 1px solid #f1f5f9; background: #ffffff; flex: 1;">
          <div style="font-size: 0.88rem; font-weight: 700; color: #0f172a; line-height: 1.45;">
            {fig.caption}
          </div>
          {#if fig.sourceRef}
            <div style="font-size: 0.76rem; color: #64748b; margin-top: 3px;">
              Sumber: {fig.sourceRef}{#if fig.sourcePage} (Hal. {fig.sourcePage}){/if}
            </div>
          {/if}

          {#if fig.annotations && fig.annotations.length > 0}
            <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 6px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
              <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #475569;">
                Keterangan Istilah pada Gambar
              </div>
              {#each fig.annotations as note}
                <div style="font-size: 0.82rem; color: #334155; line-height: 1.45;">
                  <strong style="color: #0f766e;">{note.label}:</strong> {note.explanation}
                </div>
              {/each}
            </div>
          {/if}
        </figcaption>
      </figure>
    {/each}
  </div>
{/if}

<FigureLightboxModal figure={zoomedFigure} onClose={() => (zoomedFigure = null)} />
