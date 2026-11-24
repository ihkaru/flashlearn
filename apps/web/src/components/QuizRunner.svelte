<script lang="ts">
  import type { Content, QuizResultResponse } from '@flashlearn/shared';
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import {
    getMasteryMap,
    recordQuestionMastery,
    selectDrillQuestions,
    type DrillFlashcard,
    type DrillQuestion,
    type MasteryFilter,
    type QuizMasteryMap,
  } from '../lib/quizMasteryStore';
  import FlashcardDeck from './FlashcardDeck.svelte';
  import QuizDrillSetupCard from './quiz/QuizDrillSetupCard.svelte';
  import ActivePracticeRunner from './quiz/ActivePracticeRunner.svelte';
  import PaginatedExamView from './quiz/PaginatedExamView.svelte';

  interface Props {
    content: Content;
    onCompleted?: (result: QuizResultResponse) => void;
  }

  let { content, onCompleted }: Props = $props();

  let questions = $derived((content.questions || []) as DrillQuestion[]);
  let mode = $state<'setup' | 'practice' | 'flashcards' | 'exam'>('setup');
  let masteryMap = $state<QuizMasteryMap>({});
  let sessionSize = $state<number | 'all'>('all');
  let selectedTopic = $state('all');
  let masteryFilter = $state<MasteryFilter>('all');
  let shuffle = $state(false);
  let guestName = $state(
    auth.user?.name || (typeof localStorage !== 'undefined' ? localStorage.getItem('flashlearn_guest_name') || '' : '')
  );

  let sessionQuestions = $state<DrillQuestion[]>([]);
  let flashcardItems = $state<DrillFlashcard[]>([]);
  let isLoadingFlashcards = $state(false);
  let userAnswers = $state<Record<string, string>>({});
  let examPage = $state(0);
  let isSubmitting = $state(false);
  let quizResult = $state<QuizResultResponse | null>(null);
  let errorMessage = $state<string | null>(null);

  $effect(() => {
    masteryMap = getMasteryMap(content.id);
    sessionSize = questions.length > 20 ? 20 : 'all';
    selectedTopic = 'all';
    masteryFilter = 'all';
    mode = 'setup';
    quizResult = null;
    userAnswers = {};
    examPage = 0;
  });

  function updateConfig(patch: {
    sessionSize?: number | 'all';
    selectedTopic?: string;
    masteryFilter?: MasteryFilter;
    shuffle?: boolean;
    guestName?: string;
  }) {
    if (patch.sessionSize !== undefined) sessionSize = patch.sessionSize;
    if (patch.selectedTopic !== undefined) selectedTopic = patch.selectedTopic;
    if (patch.masteryFilter !== undefined) masteryFilter = patch.masteryFilter;
    if (patch.shuffle !== undefined) shuffle = patch.shuffle;
    if (patch.guestName !== undefined) guestName = patch.guestName;
  }

  function buildSessionQuestions(): DrillQuestion[] {
    return selectDrillQuestions(questions, {
      size: sessionSize,
      topic: selectedTopic,
      masteryFilter,
      shuffle,
      masteryMap,
    });
  }

  function startPractice() {
    errorMessage = null;
    sessionQuestions = buildSessionQuestions();
    if (sessionQuestions.length > 0) mode = 'practice';
  }

  async function startFlashcards() {
    errorMessage = null;
    isLoadingFlashcards = true;
    try {
      const cards = (await api.contents.getFlashcards(content.id)) as DrillFlashcard[];
      flashcardItems = selectDrillQuestions(cards, {
        size: sessionSize,
        topic: selectedTopic,
        masteryFilter,
        shuffle,
        masteryMap,
      });
      mode = 'flashcards';
    } catch (err: any) {
      errorMessage = err?.message || 'Gagal memuat flashcard.';
    } finally {
      isLoadingFlashcards = false;
    }
  }

  function startExam() {
    errorMessage = null;
    const trimmed = guestName.trim();
    if (!auth.isLoggedIn && trimmed.length >= 2 && typeof localStorage !== 'undefined') {
      localStorage.setItem('flashlearn_guest_name', trimmed);
    }
    sessionQuestions = buildSessionQuestions();
    if (sessionQuestions.length === 0) return;
    userAnswers = {};
    quizResult = null;
    examPage = 0;
    mode = 'exam';
  }

  async function submitExam() {
    const participantName = (auth.user?.name || guestName).trim();
    if (participantName.length < 2) {
      errorMessage = 'Nama peserta minimal 2 karakter.';
      return;
    }
    isSubmitting = true;
    errorMessage = null;
    try {
      const sessionMode = sessionQuestions.length < questions.length ? 'subset' : 'full';
      const result = await api.contents.submitQuiz(content.id, {
        guestName: participantName,
        sessionMode,
        answers: Object.entries(userAnswers).map(([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        })),
      });
      quizResult = result;
      for (const r of result.reviews || []) {
        masteryMap = recordQuestionMastery(content.id, r.questionId, r.isCorrect);
      }
      examPage = 0;
      onCompleted?.(result);
    } catch (err: any) {
      errorMessage = err?.message || 'Gagal mengirim jawaban ujian.';
    } finally {
      isSubmitting = false;
    }
  }

  function handleCardRated(questionId: string, rating: 'again' | 'hard' | 'good' | 'easy') {
    masteryMap = recordQuestionMastery(content.id, questionId, rating === 'good' || rating === 'easy');
  }
</script>

<div class="quiz-runner" style="max-width: 740px; margin: 0 auto; padding: 16px;">
  {#if errorMessage}
    <div style="margin-bottom: 14px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 10px 14px; border-radius: 10px; font-size: 0.86rem; font-weight: 600;">
      {errorMessage}
    </div>
  {/if}

  {#if mode === 'setup'}
    <QuizDrillSetupCard
      {content}
      {questions}
      {masteryMap}
      {sessionSize}
      {selectedTopic}
      {masteryFilter}
      {shuffle}
      {guestName}
      isLoggedIn={auth.isLoggedIn}
      {isLoadingFlashcards}
      onUpdateConfig={updateConfig}
      onStartPractice={startPractice}
      onStartFlashcards={startFlashcards}
      onStartExam={startExam}
    />
  {:else if mode === 'practice'}
    <ActivePracticeRunner
      contentId={content.id}
      title={content.title}
      questions={sessionQuestions}
      onMasteryUpdated={(map) => (masteryMap = map)}
      onOpenFlashcards={startFlashcards}
      onBackToSetup={() => (mode = 'setup')}
    />
  {:else if mode === 'flashcards'}
    <FlashcardDeck
      flashcards={flashcardItems}
      title={`Flashcard: ${content.title}`}
      onCardRated={handleCardRated}
      onClose={() => (mode = 'setup')}
    />
  {:else}
    <PaginatedExamView
      questions={sessionQuestions}
      {userAnswers}
      {quizResult}
      {examPage}
      {isSubmitting}
      {isLoadingFlashcards}
      onSelectOption={(qId, optId) => (userAnswers[qId] = optId)}
      onPageChange={(p) => (examPage = p)}
      onSubmit={submitExam}
      onOpenFlashcards={startFlashcards}
      onBackToSetup={() => (mode = 'setup')}
    />
  {/if}
</div>
