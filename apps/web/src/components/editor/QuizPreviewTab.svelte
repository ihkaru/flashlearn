<script lang="ts">
  import type { ContentType, QuizQuestion } from '@flashlearn/shared';
  import ChipBadge from '../ui/ChipBadge.svelte';

  interface Props {
    title: string;
    summary: string;
    type: ContentType;
    readingTimeMinutes: number;
    questions: QuizQuestion[];
  }

  let { title, summary, type, readingTimeMinutes, questions }: Props = $props();
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
</script>

<div style="display: flex; flex-direction: column; gap: 16px;">
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;">
    <div style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
      <ChipBadge
        variant={type === 'quiz' ? 'quiz' : type === 'materi' ? 'materi' : 'combined'}
        icon={type === 'quiz' ? 'check-circle' : type === 'materi' ? 'book-open' : 'layers'}
        label={type.toUpperCase()}
      />
      <ChipBadge variant="neutral" icon="clock" label="~{readingTimeMinutes} Menit" />
      <ChipBadge variant="neutral" icon="check-circle" label="{questions.length} Soal" />
    </div>
    <h3 style="margin: 0 0 6px 0; font-size: 1.25rem; font-weight: 800; color: #0f172a;">
      {title || '(Judul belum diisi)'}
    </h3>
    {#if summary}
      <p style="margin: 0; font-size: 0.875rem; color: #64748b; line-height: 1.4;">
        {summary}
      </p>
    {/if}
  </div>

  <div style="font-weight: 800; font-size: 0.95rem; color: #0f172a;">
    Pratinjau Butir Soal & Kunci Jawaban:
  </div>

  {#each questions as q, qIdx}
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
      <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 12px;">
        {qIdx + 1}. {q.question || '(Pertanyaan belum diisi)'}
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
        {#each q.options as opt, optIdx}
          <div
            style="padding: 8px 12px; border-radius: 8px; border: 1.5px solid {opt.isCorrect ? '#86efac' : '#e2e8f0'}; background: {opt.isCorrect ? '#f0fdf4' : '#ffffff'}; font-size: 0.875rem; display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span style="min-width: 0; overflow-wrap: break-word;">
              <strong>{optionLetters[optIdx]}.</strong> {opt.text || '(Opsi kosong)'}
            </span>
            {#if opt.isCorrect}
              <ChipBadge variant="success" icon="check" label="Kunci Jawaban" />
            {/if}
          </div>
        {/each}
      </div>

      {#if q.explanation}
        <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; font-size: 0.8rem; color: #475569; border-left: 3px solid #0f766e;">
          <strong>Pembahasan:</strong> {q.explanation}
        </div>
      {/if}
    </div>
  {/each}
</div>
