<script lang="ts">
  import type { GuidedStepKind, InteractiveModulePayload, ModuleFigure } from '@flashlearn/shared';

  interface Props {
    payload: InteractiveModulePayload;
    stepKind: GuidedStepKind;
  }

  let { payload, stepKind }: Props = $props();

  const matchingFigures = $derived(
    (payload.figures || []).filter((f) => f.stepKind === stepKind)
  );

  let zoomedFigure = $state<ModuleFigure | null>(null);

  function closeZoom() {
    zoomedFigure = null;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && zoomedFigure) {
      closeZoom();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if matchingFigures.length > 0}
  <div style="display: flex; flex-direction: column; gap: 12px;">
    {#each matchingFigures as fig (fig.id)}
      <figure
        style="margin: 0; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; overflow: hidden;"
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
            src={fig.assetUrl}
            alt={fig.altText}
            loading="lazy"
            decoding="async"
            style="max-width: 100%; max-height: 420px; width: auto; height: auto; border-radius: 8px; object-fit: contain; display: block; margin: 0 auto;"
          />
        </button>

        <figcaption style="padding: 12px 14px; border-top: 1px solid #f1f5f9; background: #ffffff;">
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

{#if zoomedFigure}
  <div
    onclick={closeZoom}
    role="dialog"
    aria-modal="true"
    aria-label={zoomedFigure.caption}
    tabindex="-1"
    onkeydown={(e) => e.key === 'Escape' && closeZoom()}
    style="position: fixed; inset: 0; z-index: 10050; background: rgba(15, 23, 42, 0.88); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px;"
  >
    <div
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="document"
      style="max-width: 96vw; max-height: 92vh; background: #ffffff; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.4);"
    >
      <div style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <div style="font-size: 0.9rem; font-weight: 700; color: #0f172a; line-height: 1.35;">
          {zoomedFigure.caption}
        </div>
        <button
          type="button"
          onclick={closeZoom}
          class="fl-btn fl-btn-sm"
          style="background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1;"
        >
          Tutup
        </button>
      </div>
      <div style="overflow: auto; padding: 14px; background: #f8fafc; text-align: center;">
        <img
          src={zoomedFigure.assetUrl}
          alt={zoomedFigure.altText}
          style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;"
        />
      </div>
    </div>
  </div>
{/if}
