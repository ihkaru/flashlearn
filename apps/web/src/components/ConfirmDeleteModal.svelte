<script lang="ts">
  import Icon from './ui/Icon.svelte';

  interface Props {
    isOpen: boolean;
    title: string;
    itemType?: string;
    description?: string;
    confirmLabel?: string;
    isProcessing?: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }

  let {
    isOpen,
    title,
    itemType = 'Modul',
    description = 'Modul yang dihapus akan dipindahkan ke tab Arsip dan dapat Anda pulihkan kapan saja.',
    confirmLabel = 'Hapus Modul',
    isProcessing = false,
    onClose,
    onConfirm,
  }: Props = $props();
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 16px; -webkit-overflow-scrolling: touch;"
    onclick={onClose}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <!-- Dialog Box -->
    <div
      style="background: #ffffff; width: 100%; max-width: 420px; border-radius: 18px; padding: 22px 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 14px;">
        <div
          style="width: 42px; height: 42px; border-radius: 10px; background: #fff1f2; color: #e11d48; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
        >
          <Icon name="trash" size={20} />
        </div>
        <div style="flex: 1; min-width: 0;">
          <h3 style="margin: 0 0 4px 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; line-height: 1.3;">
            Hapus {itemType}?
          </h3>
          <p style="margin: 0; font-size: 0.875rem; color: #64748b; font-weight: 600; overflow-wrap: break-word; word-break: break-word;">
            "{title}"
          </p>
        </div>
      </div>

      <div
        style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; margin-bottom: 18px; font-size: 0.825rem; color: #475569; line-height: 1.5; display: flex; gap: 8px; align-items: flex-start;"
      >
        <span style="color: #0f766e; flex-shrink: 0; margin-top: 2px;">
          <Icon name="info-circle" size={15} />
        </span>
        <div>
          <strong style="color: #0f766e;">Reversible:</strong> {description}
        </div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
        <button
          type="button"
          disabled={isProcessing}
          onclick={onClose}
          class="fl-btn fl-btn-md"
          style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; font-weight: 600; font-size: 0.85rem;"
        >
          Batal
        </button>
        <button
          type="button"
          disabled={isProcessing}
          onclick={onConfirm}
          class="fl-btn fl-btn-md"
          style="background: #e11d48; color: #ffffff; border: none; font-weight: 700; font-size: 0.85rem; box-shadow: 0 4px 10px rgba(225, 29, 72, 0.2);"
        >
          {#if isProcessing}
            <span>Menghapus...</span>
          {:else}
            <Icon name="trash" size={15} />
            <span>{confirmLabel}</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
