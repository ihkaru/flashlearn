<script lang="ts">
  import type { ModuleFigure } from '@flashlearn/shared';
  import { resolveAssetUrl } from '../../lib/resolveAssetUrl';

  interface Props {
    figure: ModuleFigure | null;
    onClose: () => void;
  }

  let { figure, onClose }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && figure) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if figure}
  <div
    onclick={onClose}
    role="dialog"
    aria-modal="true"
    aria-label={figure.caption}
    tabindex="-1"
    onkeydown={(e) => e.key === 'Escape' && onClose()}
    style="position: fixed; inset: 0; z-index: 10050; background: rgba(15, 23, 42, 0.88); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px;"
  >
    <div
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="document"
      style="max-width: 96vw; max-height: 92vh; background: #ffffff; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.4);"
    >
      <div style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <div style="min-width: 0;">
          <div style="font-size: 0.9rem; font-weight: 700; color: #0f172a; line-height: 1.35;">
            {figure.caption}
          </div>
          {#if figure.sourceRef || figure.sourcePage}
            <div style="font-size: 0.74rem; color: #64748b; margin-top: 2px;">
              {figure.sourceRef || 'Sumber Materi'}{#if figure.sourcePage} · Hal. {figure.sourcePage}{/if}
            </div>
          {/if}
        </div>
        <button
          type="button"
          onclick={onClose}
          class="fl-btn fl-btn-sm"
          style="background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; flex-shrink: 0;"
        >
          Tutup
        </button>
      </div>

      <div style="overflow: auto; padding: 14px; background: #f8fafc; text-align: center;">
        <img
          src={resolveAssetUrl(figure.assetUrl)}
          alt={figure.altText}
          style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;"
        />

        {#if figure.annotations && figure.annotations.length > 0}
          <div style="margin-top: 12px; text-align: left; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #475569;">
              Keterangan Istilah pada Gambar
            </div>
            {#each figure.annotations as note}
              <div style="font-size: 0.82rem; color: #334155; line-height: 1.45;">
                <strong style="color: #0f766e;">{note.label}:</strong> {note.explanation}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
