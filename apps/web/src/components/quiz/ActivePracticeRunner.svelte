<script lang="ts">
  import { api } from '../../stores/api';
  import type { CheckQuestionResponse } from '../../stores/api/contents';
  import {
    getCalibrationInsight,
    getDifficultyBadge,
    recordQuestionMastery,
    type ConfidenceLevel,
    type DrillQuestion,
    type QuizMasteryMap,
  } from '../../lib/quizMasteryStore';
  import MarkdownRenderer from '../ui/MarkdownRenderer.svelte';

  interface Props {
    contentId: string;
    title: string;
    questions: DrillQuestion[];
    onMasteryUpdated?: (map: QuizMasteryMap) => void;
    onOpenFlashcards?: () => void;
    onBackToSetup: () => void;
  }

  let { contentId, title, questions, onMasteryUpdated, onOpenFlashcards, onBackToSetup }: Props = $props();

  let activeQuestions = $state<DrillQuestion[]>([]);
  let currentIndex = $state(0);
  let selectedOptionId = $state<string | null>(null);
  let confidence = $state<ConfidenceLevel | null>(null);
  let showHint = $state(false);
  let isChecking = $state(false);
  let checkError = $state<string | null>(null);
  let checkResult = $state<CheckQuestionResponse | null>(null);
  let correctCount = $state(0);
  let wrongIds = $state<string[]>([]);
  let isFinished = $state(false);

  function resetRunner(list: DrillQuestion[]) {
    activeQuestions = list;
    currentIndex = 0;
    selectedOptionId = null;
    confidence = null;
    showHint = false;
    checkResult = null;
    checkError = null;
    correctCount = 0;
    wrongIds = [];
    isFinished = false;
  }

  $effect(() => {
    resetRunner(questions.slice());
  });

  let currentQuestion = $derived(activeQuestions[currentIndex]);
  let progressRatio = $derived(
    activeQuestions.length > 0 ? (isFinished ? 1 : (currentIndex + (checkResult ? 1 : 0)) / activeQuestions.length) : 0
  );
  let calibrationNote = $derived(checkResult ? getCalibrationInsight(confidence, checkResult.isCorrect) : null);

  async function verifyAnswer() {
    if (!currentQuestion || !selectedOptionId || isChecking || checkResult) return;
    isChecking = true;
    checkError = null;
    try {
      const res = await api.contents.checkQuestion(contentId, currentQuestion.id, selectedOptionId);
      checkResult = res;
      if (res.isCorrect) correctCount++;
      else if (!wrongIds.includes(currentQuestion.id)) wrongIds = [...wrongIds, currentQuestion.id];
      const updated = recordQuestionMastery(contentId, currentQuestion.id, res.isCorrect, confidence ?? undefined);
      onMasteryUpdated?.(updated);
    } catch (err: any) {
      checkError = err?.message || 'Gagal memeriksa jawaban. Coba lagi.';
    } finally {
      isChecking = false;
    }
  }

  function nextQuestion() {
    if (currentIndex + 1 < activeQuestions.length) {
      currentIndex++;
      selectedOptionId = null;
      confidence = null;
      showHint = false;
      checkResult = null;
      checkError = null;
    } else {
      isFinished = true;
    }
  }
</script>

<div>
  <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
    <button type="button" onclick={onBackToSetup} style="background: none; border: none; color: var(--ws-accent, #0f766e); font-weight: 700; font-size: 0.9rem; cursor: pointer; padding: 0;">
      ← Pengaturan Sesi
    </button>
    <div style="font-size: 0.84rem; font-weight: 700; color: #334155;">
      {!isFinished && activeQuestions.length > 0 ? `Soal ${currentIndex + 1} / ${activeQuestions.length}` : 'Ringkasan Latihan'}
    </div>
  </div>

  <div style="height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: 18px;">
    <div class="fl-progress-bar-fill" style="background: var(--ws-accent, #0f766e); transform: scaleX({progressRatio});"></div>
  </div>

  {#if isFinished}
    {@const accuracy = activeQuestions.length > 0 ? Math.round((correctCount / activeQuestions.length) * 100) : 0}
    <div class="fl-step-enter" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 26px 22px; text-align: center;">
      <div style="font-size: 0.8rem; font-weight: 700; color: var(--ws-accent, #0f766e); text-transform: uppercase; margin-bottom: 6px;">{title}</div>
      <h2 style="margin: 0 0 8px 0; font-size: 1.45rem; font-weight: 800; color: #0f172a;">Latihan Selesai · {accuracy}% Tepat</h2>
      <p style="margin: 0 0 20px 0; font-size: 0.92rem; color: #475569;">
        Benar <strong>{correctCount}</strong> dari <strong>{activeQuestions.length}</strong> soal.
      </p>
      <div style="display: flex; flex-direction: column; gap: 10px; max-width: 380px; margin: 0 auto;">
        {#if wrongIds.length > 0}
          <button type="button" onclick={() => resetRunner(activeQuestions.filter((q) => wrongIds.includes(q.id)))} class="fl-btn fl-btn-lg" style="background: var(--ws-accent, #0f766e); color: #ffffff; border: none; font-weight: 700; width: 100%;">
            Ulangi Soal yang Salah ({wrongIds.length})
          </button>
        {/if}
        {#if onOpenFlashcards}
          <button type="button" onclick={onOpenFlashcards} class="fl-btn fl-btn-md" style="background: #ffffff; color: #0f172a; border: 1.5px solid #cbd5e1; font-weight: 700; width: 100%;">
            Lanjut ke Flashcard 3D
          </button>
        {/if}
        <button type="button" onclick={onBackToSetup} class="fl-btn fl-btn-md" style="background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; font-weight: 600; width: 100%;">
          Kembali ke Pengaturan
        </button>
      </div>
    </div>
  {:else if currentQuestion}
    {#key currentQuestion.id}
      {@const diff = getDifficultyBadge(currentQuestion.difficulty)}
      <section class="fl-step-enter" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: clamp(18px, 3vw, 24px);">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
          {#if currentQuestion.topic}
            <span style="background: #f0fdfa; color: var(--ws-accent, #0f766e); border: 1px solid #99f6e4; font-size: 0.75rem; font-weight: 700; padding: 3px 9px; border-radius: 999px;">{currentQuestion.topic}</span>
          {/if}
          {#if currentQuestion.difficulty}
            <span style="background: {diff.bg}; color: {diff.fg}; font-size: 0.74rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;">{diff.text}</span>
          {/if}
        </div>

        <div style="font-size: 1.06rem; color: #0f172a; line-height: 1.55; margin-bottom: 14px;">
          <MarkdownRenderer content={currentQuestion.question} />
        </div>

        {#if currentQuestion.hint}
          <div style="margin-bottom: 14px;">
            <button type="button" onclick={() => (showHint = !showHint)} style="background: none; border: none; color: #475569; font-size: 0.82rem; font-weight: 700; cursor: pointer; padding: 0; text-decoration: underline;">
              {showHint ? 'Sembunyikan Petunjuk' : 'Lihat Petunjuk'}
            </button>
            {#if showHint}
              <div style="margin-top: 8px; background: #f8fafc; border-left: 3px solid var(--ws-accent, #0f766e); padding: 10px 12px; border-radius: 6px; font-size: 0.86rem; color: #334155;">
                {currentQuestion.hint}
              </div>
            {/if}
          </div>
        {/if}

        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
          {#each currentQuestion.options as opt}
            {@const isSelected = selectedOptionId === opt.id}
            <button
              type="button"
              disabled={Boolean(checkResult)}
              onclick={() => (selectedOptionId = opt.id)}
              class="quiz-option-card"
              class:selected={isSelected && !checkResult}
              class:correct={Boolean(checkResult && checkResult.correctOptionId === opt.id)}
              class:incorrect={Boolean(checkResult && isSelected && !checkResult.isCorrect)}
              style="width: 100%; text-align: left; margin-bottom: 0;"
            >
              <span style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid {isSelected ? 'var(--ws-accent, #0f766e)' : '#cbd5e1'}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
                {#if isSelected}<span style="width: 9px; height: 9px; border-radius: 50%; background: var(--ws-accent, #0f766e);"></span>{/if}
              </span>
              <span style="font-size: 0.94rem; line-height: 1.45; color: #0f172a; flex: 1;">
                <MarkdownRenderer content={opt.text} />
              </span>
            </button>
          {/each}
        </div>

        {#if !checkResult}
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 14px;">
            <span style="font-size: 0.8rem; font-weight: 600; color: #475569;">Keyakinan (opsional):</span>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              {#each [{ id: 'sure', label: 'Yakin' }, { id: 'unsure', label: 'Ragu' }, { id: 'guess', label: 'Menebak' }] as c}
                {@const active = confidence === c.id}
                <button type="button" onclick={() => (confidence = active ? null : (c.id as ConfidenceLevel))} style="min-height: 32px; padding: 4px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; cursor: pointer; border: 1px solid {active ? 'var(--ws-accent, #0f766e)' : '#cbd5e1'}; background: {active ? '#f0fdfa' : '#ffffff'}; color: {active ? 'var(--ws-accent, #0f766e)' : '#475569'};">
                  {c.label}
                </button>
              {/each}
            </div>
          </div>

          {#if checkError}
            <div style="margin-bottom: 12px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 10px 12px; border-radius: 8px; font-size: 0.84rem; font-weight: 600;">{checkError}</div>
          {/if}

          <button type="button" disabled={!selectedOptionId || isChecking} onclick={verifyAnswer} class="fl-btn fl-btn-lg" style="background: var(--ws-accent, #0f766e); color: #ffffff; border: none; font-weight: 700; width: 100%; opacity: {!selectedOptionId || isChecking ? 0.55 : 1};">
            {isChecking ? 'Memeriksa...' : 'Periksa Jawaban'}
          </button>
        {:else}
          <div class={checkResult.isCorrect ? 'fl-feedback-correct' : 'fl-feedback-nudge'} style="background: {checkResult.isCorrect ? '#f0fdf4' : '#fff7ed'}; border: 1.5px solid {checkResult.isCorrect ? '#86efac' : '#fdba74'}; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px;">
            <div style="font-size: 0.9rem; font-weight: 800; color: {checkResult.isCorrect ? '#166534' : '#9a3412'}; margin-bottom: 6px;">
              {checkResult.isCorrect ? 'Jawaban Tepat' : 'Belum Tepat'}
            </div>
            {#if calibrationNote}
              <div style="font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 8px;">{calibrationNote}</div>
            {/if}
            <div style="font-size: 0.9rem; color: #1e293b; line-height: 1.5;">
              <MarkdownRenderer content={checkResult.explanation} />
            </div>
          </div>
          <button type="button" onclick={nextQuestion} class="fl-btn fl-btn-lg" style="background: var(--ws-accent, #0f766e); color: #ffffff; border: none; font-weight: 700; width: 100%;">
            {currentIndex + 1 < activeQuestions.length ? 'Soal Berikutnya →' : 'Lihat Ringkasan Sesi'}
          </button>
        {/if}
      </section>
    {/key}
  {/if}
</div>
