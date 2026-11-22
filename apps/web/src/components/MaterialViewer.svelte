<script lang="ts">
  import type { Content } from '@flashlearn/shared';
  import MarkdownRenderer from './ui/MarkdownRenderer.svelte';

  interface Props {
    content: Content;
    onCompleted?: () => void;
  }

  let { content, onCompleted }: Props = $props();
  let isDone = $state(false);

  function markCompleted() {
    isDone = true;
    if (onCompleted) onCompleted();
  }
</script>

<div class="material-viewer" style="max-width: 740px; margin: 0 auto; padding: 20px 16px;">
  <!-- Header -->
  <div style="margin-bottom: 24px;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
      <span class="badge-materi">Materi Pembelajaran</span>
      {#if content.readingTimeMinutes}
        <span style="font-size: 0.82rem; color: #475569;">Estimasi {content.readingTimeMinutes} menit baca</span>
      {/if}
    </div>

    <h1 style="font-size: clamp(1.45rem, 3.5vw, 1.85rem); color: #0f172a; margin: 0 0 12px 0; font-weight: 800; line-height: 1.3;">
      {content.title}
    </h1>

    {#if content.summary}
      <div
        style="background: #f0fdfa; border-left: 4px solid #0f766e; padding: 14px 18px; border-radius: 8px; font-size: 0.96rem; color: #134e4a; line-height: 1.55; margin-bottom: 20px;"
      >
        <strong>Ringkasan Inti:</strong> {content.summary}
      </div>
    {/if}
  </div>

  <!-- Body Content -->
  <div
    class="material-body"
    style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: clamp(18px, 3vw, 28px);"
  >
    {#if content.body}
      <MarkdownRenderer content={content.body} />
    {:else}
      <p style="color: #475569; font-style: italic;">Materi sedang disiapkan oleh kreator.</p>
    {/if}
  </div>

  <!-- Official Corpus of Record Citations -->
  {#if content.citations && content.citations.length > 0}
    <div style="margin-top: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;">
      <h4 style="margin: 0 0 12px 0; font-size: 0.95rem; font-weight: 800; color: #0f172a;">
        Dasar Regulasi &amp; Rujukan Resmi (Corpus of Record)
      </h4>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        {#each content.citations as cit (cit.id || cit.sourceChunkId)}
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px; font-size: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap;">
              <span style="font-weight: 800; color: #0f766e; background: #ccfbf1; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">
                {cit.locationTag || 'Pasal Rujukan'}
              </span>
              {#if cit.sourceCode}
                <span style="font-weight: 700; color: #475569; font-size: 0.78rem;">
                  {cit.sourceCode}
                </span>
              {/if}
            </div>
            <div style="color: #334155; line-height: 1.5;">
              {cit.chunkContent || cit.annotation || 'Rujukan resmi terverifikasi.'}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Finish Button -->
  <div style="margin-top: 28px; text-align: center;">
    {#if !isDone}
      <button
        onclick={markCompleted}
        class="fl-btn fl-btn-lg"
        style="background: #0f766e; color: #ffffff; border: none; font-weight: 700;"
      >
        Tandai Selesai Membaca
      </button>
    {:else}
      <div style="display: inline-flex; align-items: center; background: #dcfce7; color: #166534; font-weight: 700; padding: 12px 24px; border-radius: 10px;">
        Kamu telah menyelesaikan materi ini
      </div>
    {/if}
  </div>
</div>
