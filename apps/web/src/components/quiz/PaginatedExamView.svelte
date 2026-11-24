<script lang="ts">
  import type { QuizResultResponse } from '@flashlearn/shared';
  import type { DrillQuestion } from '../../lib/quizMasteryStore';
  import MarkdownRenderer from '../ui/MarkdownRenderer.svelte';

  interface Props {
    questions: DrillQuestion[];
    userAnswers: Record<string, string>;
    quizResult: QuizResultResponse | null;
    examPage: number;
    pageSize?: number;
    isSubmitting: boolean;
    isLoadingFlashcards: boolean;
    onSelectOption: (questionId: string, optionId: string) => void;
    onPageChange: (nextPage: number) => void;
    onSubmit: () => void;
    onOpenFlashcards: () => void;
    onBackToSetup: () => void;
  }

  let {
    questions, userAnswers, quizResult, examPage, pageSize = 10,
    isSubmitting, isLoadingFlashcards,
    onSelectOption, onPageChange, onSubmit, onOpenFlashcards, onBackToSetup,
  }: Props = $props();

  let totalPages = $derived(Math.max(1, Math.ceil(questions.length / pageSize)));
  let pagedQuestions = $derived(questions.slice(examPage * pageSize, (examPage + 1) * pageSize));
  let answeredCount = $derived(Object.keys(userAnswers).length);

  function goToPage(p: number) {
    onPageChange(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

<div>
  <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px;">
    <button type="button" onclick={onBackToSetup} style="background: none; border: none; color: var(--ws-accent, #0f766e); font-weight: 700; font-size: 0.9rem; cursor: pointer; padding: 0;">
      ← Pengaturan Sesi
    </button>
    <span style="font-size: 0.84rem; font-weight: 700; color: #334155;">
      Terjawab {answeredCount} / {questions.length} · Hal {examPage + 1}/{totalPages}
    </span>
  </div>

  {#if quizResult}
    <div class="fl-step-enter" style="background: {quizResult.passed ? '#f0fdf4' : '#fff7ed'}; border: 1.5px solid {quizResult.passed ? '#86efac' : '#fdba74'}; border-radius: 16px; padding: 22px; margin-bottom: 20px; text-align: center;">
      <h2 style="margin: 0 0 6px 0; font-size: 1.45rem; color: #0f172a;">
        Skor Akhir: <span style="color: {quizResult.passed ? '#166534' : '#9a3412'}; font-weight: 800;">{quizResult.percentage}%</span>
      </h2>
      <p style="color: #475569; margin: 0 0 16px 0; font-size: 0.92rem;">
        Benar <strong>{quizResult.correctAnswers}</strong> dari <strong>{quizResult.totalQuestions}</strong> soal.
      </p>
      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button type="button" onclick={onOpenFlashcards} disabled={isLoadingFlashcards} class="fl-btn fl-btn-md" style="background: var(--ws-accent, #0f766e); color: #ffffff; border: none; font-weight: 700;">
          {isLoadingFlashcards ? 'Memuat...' : 'Buka Flashcard 3D'}
        </button>
        <button type="button" onclick={onBackToSetup} class="fl-btn fl-btn-md" style="background: #ffffff; color: #334155; border: 1px solid #cbd5e1; font-weight: 600;">
          Kembali ke Pengaturan
        </button>
      </div>
    </div>
  {/if}

  <div style="display: flex; flex-direction: column; gap: 16px;">
    {#each pagedQuestions as q, idx (q.id)}
      {@const globalIdx = examPage * pageSize + idx}
      {@const review = quizResult?.reviews?.find((r) => r.questionId === q.id)}
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 10px;">
          <span style="font-weight: 800; font-size: 0.8rem; color: var(--ws-accent, #0f766e); text-transform: uppercase;">
            Soal {globalIdx + 1} / {questions.length}{q.topic ? ` · ${q.topic}` : ''}
          </span>
          {#if review}
            <span style="font-size: 0.76rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; background: {review.isCorrect ? '#dcfce7' : '#fee2e2'}; color: {review.isCorrect ? '#166534' : '#991b1b'};">
              {review.isCorrect ? 'Benar' : 'Belum Tepat'}
            </span>
          {/if}
        </div>
        <div style="font-size: 1.02rem; color: #0f172a; margin-bottom: 12px; line-height: 1.5;">
          <MarkdownRenderer content={q.question} />
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          {#each q.options as opt}
            {@const isSelected = userAnswers[q.id] === opt.id}
            <button
              type="button"
              disabled={Boolean(quizResult)}
              onclick={() => onSelectOption(q.id, opt.id)}
              class="quiz-option-card"
              class:selected={isSelected && !review}
              class:correct={Boolean(review && review.correctOptionId === opt.id)}
              class:incorrect={Boolean(review && isSelected && !review.isCorrect)}
              style="width: 100%; text-align: left; margin-bottom: 0;"
            >
              <span style="font-size: 0.92rem; color: #0f172a; line-height: 1.45;">{opt.text}</span>
            </button>
          {/each}
        </div>
        {#if review}
          <div style="margin-top: 12px; background: #f8fafc; border-left: 3px solid var(--ws-accent, #0f766e); padding: 10px 12px; border-radius: 6px; font-size: 0.88rem; color: #334155;">
            <MarkdownRenderer content={review.explanation} />
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
    <button type="button" disabled={examPage === 0} onclick={() => goToPage(examPage - 1)} class="fl-btn fl-btn-md" style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; opacity: {examPage === 0 ? 0.5 : 1};">
      ← Sebelumnya
    </button>
    {#if !quizResult && examPage === totalPages - 1}
      <button type="button" disabled={isSubmitting || answeredCount === 0} onclick={onSubmit} class="fl-btn fl-btn-lg" style="background: var(--ws-accent, #0f766e); color: #ffffff; border: none; font-weight: 700; opacity: {answeredCount === 0 ? 0.55 : 1};">
        {isSubmitting ? 'Memeriksa...' : `Kirim Jawaban (${answeredCount}/${questions.length})`}
      </button>
    {:else if examPage + 1 < totalPages}
      <button type="button" onclick={() => goToPage(examPage + 1)} class="fl-btn fl-btn-md" style="background: var(--ws-accent, #0f766e); color: #ffffff; border: none; font-weight: 700;">
        Halaman Berikutnya →
      </button>
    {/if}
  </div>
</div>
