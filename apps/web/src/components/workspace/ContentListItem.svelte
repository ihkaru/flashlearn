<script lang="ts">
  import type { Content, LearnerContentProgress } from '@flashlearn/shared';
  import Icon from '../ui/Icon.svelte';
  import ChipBadge from '../ui/ChipBadge.svelte';

  interface Props {
    content: Content;
    progress?: LearnerContentProgress | null;
    isOwner: boolean;
    isTrash: boolean;
    isRestoring?: boolean;
    copiedLinkId?: string | null;
    onNavigate: (c: Content) => void;
    onCopyLink: (c: Content, e: Event) => void;
    onOpenReview: (c: Content, e: Event, tab: 'analysis' | 'participants') => void;
    onOpenEdit: (c: Content, e: Event) => void;
    onRollback: (c: Content, e: Event) => void;
    onDelete: (c: Content, e: Event) => void;
    onRestore: (c: Content, e: Event) => void;
  }

  let {
    content: c,
    progress = null,
    isOwner,
    isTrash,
    isRestoring = false,
    copiedLinkId = null,
    onNavigate,
    onCopyLink,
    onOpenReview,
    onOpenEdit,
    onRollback,
    onDelete,
    onRestore,
  }: Props = $props();
</script>

{#if isTrash}
  <!-- Soft Deleted Item Card in Trash Tab -->
  <div
    style="background: #fff7ed; border: 1.5px dashed #fdba74; border-radius: 14px; padding: 16px 18px; display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;"
  >
    <div style="flex: 1; min-width: 220px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <ChipBadge variant="danger" label="Arsip Terhapus" />
        <span style="font-size: 0.75rem; color: #9a3412; font-weight: 600; text-transform: uppercase;">
          {c.type}
        </span>
      </div>
      <h3 style="margin: 0 0 4px 0; font-size: 1.05rem; color: #7c2d12; font-weight: 700; overflow-wrap: break-word;">
        {c.title}
      </h3>
      <div style="font-size: 0.775rem; color: #9a3412;">
        Dihapus: {c.deletedAt ? new Date(c.deletedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
      </div>
    </div>

    <div>
      <button
        onclick={(e) => onRestore(c, e)}
        disabled={isRestoring}
        class="fl-btn fl-btn-sm"
        style="background: #0f766e; color: #ffffff; border: none; font-weight: 700;"
      >
        <span>{isRestoring ? 'Memulihkan...' : 'Pulihkan Modul'}</span>
      </button>
    </div>
  </div>
{:else}
  <!-- Active Content Card -->
  <div
    class="content-card fl-card-hover"
    onclick={() => onNavigate(c)}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Enter' && onNavigate(c)}
    style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; cursor: pointer; display: flex; flex-direction: column; gap: 12px;"
  >
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
          <ChipBadge
            variant={c.type === 'quiz' ? 'quiz' : c.type === 'materi' ? 'materi' : 'combined'}
            label={c.type === 'interactive_module' ? 'Panduan Interaktif' : c.type === 'quiz' ? 'Kuis' : c.type === 'materi' ? 'Materi' : 'Materi + Kuis'}
          />

          {#if c.hasSlideDeck}
            <ChipBadge variant="neutral" label="Slide Visual" />
          {/if}

          {#if c.questions && c.questions.length > 0}
            <ChipBadge variant="neutral" label="{c.questions.length} Soal" />
          {/if}

          {#if c.readingTimeMinutes}
            <ChipBadge variant="neutral" label="~{c.readingTimeMinutes} mnt" />
          {/if}
        </div>

        <h3 style="margin: 0 0 6px 0; font-size: 1.08rem; color: #0f172a; font-weight: 700; line-height: 1.35; overflow-wrap: break-word;">
          {c.title}
        </h3>

        {#if c.summary}
          <p style="margin: 0; font-size: 0.86rem; color: #475569; line-height: 1.5; overflow-wrap: break-word;">
            {c.summary}
          </p>
        {/if}

        {#if progress}
          {@const pct = Math.min(100, Math.round(((progress.currentStepIndex + 1) / Math.max(1, progress.totalSteps)) * 100))}
          <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px;">
            <div style="flex: 1; max-width: 180px; height: 5px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
              <div class="fl-progress-bar-fill" style="background: {progress.isCompleted ? '#16a34a' : 'var(--ws-accent, #0f766e)'}; transform: scaleX({pct / 100});"></div>
            </div>
            <span style="font-size: 0.76rem; font-weight: 700; color: {progress.isCompleted ? '#15803d' : 'var(--ws-accent, #0f766e)'};">
              {progress.isCompleted ? 'Selesai' : `Langkah ${progress.currentStepIndex + 1}/${progress.totalSteps}`}
            </span>
          </div>
        {/if}
      </div>

      <div style="flex-shrink: 0;">
        <span style="color: var(--ws-accent, #0f766e); font-weight: 700; font-size: 0.85rem; white-space: nowrap;">
          {progress && !progress.isCompleted ? 'Lanjutkan' : progress?.isCompleted ? 'Tinjau' : 'Mulai'}
        </span>
      </div>
    </div>

    {#if isOwner}
      <div
        style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid #f1f5f9; gap: 8px; flex-wrap: wrap;"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        role="toolbar"
        tabindex="0"
      >
        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
          <button
            type="button"
            onclick={(e) => onCopyLink(c, e)}
            class="fl-btn fl-btn-sm"
            style="background: #f8fafc; border: 1px solid #e2e8f0; color: #334155;"
          >
            <span>{copiedLinkId === c.id ? 'Tersalin' : 'Salin Link'}</span>
          </button>

          {#if c.type !== 'materi' && c.type !== 'interactive_module'}
            <button
              type="button"
              class="fl-btn fl-btn-sm fl-pill-btn"
              onclick={(e) => onOpenReview(c, e, 'analysis')}
              title="Bahas butir soal & analisis kesalahan peserta"
              style="background: #f0fdfa; border: 1px solid #99f6e4; color: #0f766e;"
            >
              <span>Bahas Soal</span>
            </button>

            <button
              type="button"
              class="fl-btn fl-btn-sm fl-pill-btn"
              onclick={(e) => onOpenReview(c, e, 'participants')}
              title="Rekap nilai peserta & ekspor Excel"
              style="background: #eef2ff; border: 1px solid #c7d2fe; color: #4338ca;"
            >
              <span>Rekap Nilai</span>
            </button>
          {/if}
        </div>

        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
          <button
            type="button"
            onclick={(e) => onOpenEdit(c, e)}
            title="Edit modul pembelajaran"
            class="fl-btn fl-btn-sm"
            style="background: #0f766e; border: none; color: #ffffff;"
          >
            <span>Edit</span>
          </button>

          <button
            type="button"
            onclick={(e) => onRollback(c, e)}
            title="Kembalikan ke snapshot versi sebelumnya"
            class="fl-btn fl-btn-sm"
            style="background: #fefce8; border: 1px solid #fde68a; color: #854d0e;"
          >
            <span>Rollback</span>
          </button>

          <button
            type="button"
            onclick={(e) => onDelete(c, e)}
            title="Hapus modul ini"
            aria-label="Hapus modul"
            class="fl-btn fl-btn-sm"
            style="background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; padding: 6px 10px;"
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>
    {/if}
  </div>
{/if}
