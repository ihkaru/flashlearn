<script lang="ts">
  import type { ResumableSessionSummary } from '../../stores/api/contents';

  interface Props {
    sessions: ResumableSessionSummary[];
    onOpenContent: (contentId: string) => void;
  }

  let { sessions, onOpenContent }: Props = $props();
</script>

{#if sessions.length > 0}
  <section style="margin-bottom: 28px;" aria-label="Lanjutkan belajar">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; gap: 8px;">
      <h2 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a;">
        Lanjutkan Belajar
      </h2>
      <span style="font-size: 0.8rem; color: #475569; font-weight: 600;">
        Progres tersimpan otomatis
      </span>
    </div>

    <div class="fl-grid-cards">
      {#each sessions as item (item.contentId)}
        {@const pct = Math.min(100, Math.round(((item.currentStepIndex + 1) / Math.max(1, item.totalSteps)) * 100))}
        <button
          type="button"
          onclick={() => onOpenContent(item.contentId)}
          class="fl-card-hover fl-btn-wrap"
          style="background: #ffffff; border: 1.5px solid #99f6e4; border-radius: 14px; padding: 16px; text-align: left; display: flex; flex-direction: column; gap: 10px; width: 100%;"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; width: 100%;">
            <span style="font-size: 0.74rem; font-weight: 700; color: #0f766e; background: #f0fdfa; padding: 3px 8px; border-radius: 6px;">
              {item.workspaceName}
            </span>
            <span style="font-size: 0.76rem; font-weight: 700; color: {item.isCompleted ? '#15803d' : '#0f766e'}; white-space: nowrap;">
              {item.isCompleted ? 'Selesai' : `Langkah ${item.currentStepIndex + 1}/${item.totalSteps}`}
            </span>
          </div>

          <div style="font-size: 0.98rem; font-weight: 800; color: #0f172a; line-height: 1.35;">
            {item.contentTitle}
          </div>

          <div style="width: 100%; height: 5px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
            <div
              style="height: 100%; width: 100%; background: {item.isCompleted ? '#16a34a' : '#0f766e'}; transform-origin: left center; transform: scaleX({pct / 100});"
            ></div>
          </div>

          <span style="font-size: 0.82rem; font-weight: 700; color: #0f766e;">
            {item.isCompleted ? 'Tinjau Kembali' : 'Lanjutkan Sekarang'}
          </span>
        </button>
      {/each}
    </div>
  </section>
{/if}
