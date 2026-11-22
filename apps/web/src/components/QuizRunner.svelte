<script lang="ts">
  import type { Content, QuizResultResponse, FlashcardItem } from '@flashlearn/shared';
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import FlashcardDeck from './FlashcardDeck.svelte';

  interface Props {
    content: Content;
    onCompleted?: (result: QuizResultResponse) => void;
  }

  let { content, onCompleted }: Props = $props();

  let questions = $derived(content.questions || []);
  let userAnswers = $state<Record<string, string>>({});
  let isSubmitting = $state(false);
  let quizResult = $state<QuizResultResponse | null>(null);
  let showFlashcards = $state(false);
  let flashcardItems = $state<FlashcardItem[]>([]);
  let isLoadingFlashcards = $state(false);

  // Guest Onboarding & Name Disambiguation
  let guestName = $state(
    auth.user?.name || localStorage.getItem('flashlearn_guest_name') || ''
  );
  let hasStartedQuiz = $state(auth.isLoggedIn && Boolean(auth.user?.name));
  let isCheckingName = $state(false);
  let nameFeedback = $state<{ isTaken: boolean; suggestedName: string } | null>(null);
  let validationError = $state<string | null>(null);

  const isNameValid = $derived(guestName.trim().length >= 2);

  async function handleNameCheck() {
    const trimmed = guestName.trim();
    if (!trimmed || trimmed.length < 2 || auth.isLoggedIn) {
      nameFeedback = null;
      return;
    }

    isCheckingName = true;
    try {
      const res = await api.contents.checkGuestName(content.id, trimmed);
      nameFeedback = res.isTaken ? res : null;
    } catch {
      nameFeedback = null;
    } finally {
      isCheckingName = false;
    }
  }

  function applySuggestedName() {
    if (nameFeedback?.suggestedName) {
      guestName = nameFeedback.suggestedName;
      nameFeedback = null;
      validationError = null;
    }
  }

  function startQuiz() {
    const trimmed = guestName.trim();
    if (!trimmed || trimmed.length < 2) {
      validationError = 'Silakan masukkan nama atau panggilanmu (minimal 2 karakter) sebelum memulai kuis.';
      return;
    }
    validationError = null;
    localStorage.setItem('flashlearn_guest_name', trimmed);
    hasStartedQuiz = true;
  }

  function selectOption(questionId: string, optionId: string) {
    if (quizResult) return; // Locked after submission
    userAnswers[questionId] = optionId;
  }

  async function submitQuiz() {
    const trimmed = guestName.trim();
    if (!trimmed || trimmed.length < 2) {
      alert('Nama wajib diisi minimal 2 karakter sebelum mengirim jawaban kuis.');
      return;
    }

    isSubmitting = true;
    try {
      const payload = {
        guestName: trimmed,
        answers: Object.entries(userAnswers).map(([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        })),
      };

      const result = await api.contents.submitQuiz(content.id, payload);
      quizResult = result;
      if (onCompleted) onCompleted(result);
    } catch (err: any) {
      alert(`Gagal mengirim jawaban: ${err.message}`);
    } finally {
      isSubmitting = false;
    }
  }

  async function openFlashcards() {
    isLoadingFlashcards = true;
    try {
      const cards = await api.contents.getFlashcards(content.id);
      flashcardItems = cards;
      showFlashcards = true;
    } catch (err: any) {
      alert(`Gagal memuat flashcard: ${err.message}`);
    } finally {
      isLoadingFlashcards = false;
    }
  }

  function retryQuiz() {
    userAnswers = {};
    quizResult = null;
    showFlashcards = false;
    if (!auth.isLoggedIn) {
      hasStartedQuiz = false;
    }
  }
</script>

<div class="quiz-runner" style="max-width: 720px; margin: 0 auto; padding: 16px;">
  {#if showFlashcards && flashcardItems.length > 0}
    <!-- Active Recall 3D Flashcards View -->
    <div style="margin-bottom: 20px;">
      <button
        onclick={() => (showFlashcards = false)}
        style="background: none; border: none; color: #0f766e; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.95rem; padding: 0;"
      >
        ← Kembali ke Hasil Kuis
      </button>
    </div>
    <FlashcardDeck
      flashcards={flashcardItems}
      title={`Flashcard: ${content.title}`}
      onClose={() => (showFlashcards = false)}
    />
  {:else if !hasStartedQuiz}
    <!-- Guest Quiz Briefing & Name Entry (Progressive Disclosure) -->
    <div
      style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: clamp(22px, 4vw, 34px); text-align: center; max-width: 540px; margin: 20px auto;"
    >
      <div style="display: inline-block; background: #fef3c7; color: #92400e; font-weight: 700; font-size: 0.76rem; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; margin-bottom: 12px;">
        Asesmen Kuis Interaktif
      </div>
      <h1 style="font-size: clamp(1.35rem, 3.5vw, 1.6rem); color: #0f172a; margin: 0 0 10px 0; font-weight: 800; line-height: 1.3;">
        {content.title}
      </h1>
      {#if content.summary}
        <p style="color: #475569; font-size: 0.94rem; margin: 0 0 20px 0; line-height: 1.55;">
          {content.summary}
        </p>
      {/if}

      <div style="display: flex; justify-content: center; gap: 14px; margin-bottom: 24px; flex-wrap: wrap;">
        <div style="background: #f8fafc; padding: 10px 18px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="font-size: 1.25rem; font-weight: 800; color: #0f766e;">{questions.length}</div>
          <div style="font-size: 0.76rem; color: #475569; font-weight: 600;">Jumlah Soal</div>
        </div>
        <div style="background: #f8fafc; padding: 10px 18px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="font-size: 1.25rem; font-weight: 800; color: #ea580c;">~{content.readingTimeMinutes || 5} m</div>
          <div style="font-size: 0.76rem; color: #475569; font-weight: 600;">Estimasi Durasi</div>
        </div>
      </div>

      <!-- Single-field Name Input with Validation & Auto-disambiguation -->
      <div style="text-align: left; background: #f8fafc; padding: 18px; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
        <label for="participant-name" style="display: block; font-weight: 700; font-size: 0.9rem; color: #1e293b; margin-bottom: 6px;">
          Nama Lengkap / Panggilanmu <span style="color: #dc2626;">*</span>:
        </label>
        <div style="position: relative;">
          <input
            id="participant-name"
            type="text"
            placeholder="Ketik nama lengkap atau panggilanmu..."
            bind:value={guestName}
            onblur={handleNameCheck}
            oninput={() => { nameFeedback = null; validationError = null; }}
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (isNameValid && !isCheckingName) startQuiz();
                else if (!isNameValid) validationError = 'Silakan masukkan nama atau panggilanmu (minimal 2 karakter) sebelum memulai kuis.';
              }
            }}
            style="width: 100%; padding: 12px 14px; border: 1.5px solid {validationError ? '#ef4444' : nameFeedback ? '#f59e0b' : '#cbd5e1'}; border-radius: 10px; font-size: 0.95rem; color: #0f172a; background: #ffffff;"
          />
          {#if isCheckingName}
            <span style="position: absolute; right: 12px; top: 14px; font-size: 0.8rem; color: #475569;">
              Memeriksa...
            </span>
          {/if}
        </div>

        <!-- Validation Error Message -->
        {#if validationError}
          <div style="margin-top: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 8px 12px; font-size: 0.85rem; color: #b91c1c; font-weight: 600;">
            {validationError}
          </div>
        {/if}

        <!-- Disambiguation Suggestion if duplicate name is found -->
        {#if nameFeedback?.isTaken}
          <div style="margin-top: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 12px; font-size: 0.84rem; color: #92400e; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
            <div>Nama <strong>"{guestName}"</strong> sudah digunakan di kuis ini.</div>
            <button
              onclick={applySuggestedName}
              class="fl-btn fl-btn-sm"
              style="background: #d97706; color: #ffffff; border: none; font-weight: 700;"
            >
              Gunakan {nameFeedback.suggestedName}
            </button>
          </div>
        {/if}
        <div style="font-size: 0.78rem; color: #475569; margin-top: 6px;">
          Nama diperlukan untuk pencatatan skor dan statistik pengerjaan.
        </div>
      </div>

      <!-- Action Button -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button
          onclick={startQuiz}
          disabled={!isNameValid || isCheckingName}
          class="fl-btn fl-btn-lg"
          style="background: {!isNameValid || isCheckingName ? '#94a3b8' : '#0f766e'}; color: #ffffff; border: none; font-weight: 700; width: 100%;"
        >
          <span>{isCheckingName ? 'Memeriksa Nama...' : 'Mulai Mengerjakan Kuis'}</span>
        </button>

        {#if !isNameValid}
          <div style="font-size: 0.8rem; color: #475569; text-align: center; margin-top: 4px;">
            Masukkan nama terlebih dahulu untuk membuka tombol mulai.
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Active Quiz Runner -->
    <div style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="badge-quiz">Kuis Interaktif</span>
          {#if guestName}
            <span style="font-size: 0.85rem; font-weight: 600; color: #0f766e;">
              Peserta: {guestName}
            </span>
          {/if}
        </div>
        {#if content.readingTimeMinutes}
          <span style="font-size: 0.8rem; color: #475569;">~{content.readingTimeMinutes} menit</span>
        {/if}
      </div>

      <h1 style="font-size: clamp(1.35rem, 3.5vw, 1.6rem); color: #0f172a; margin: 0 0 8px 0; font-weight: 800;">
        {content.title}
      </h1>
      {#if content.summary}
        <p style="color: #475569; font-size: 0.94rem; margin: 0;">{content.summary}</p>
      {/if}
    </div>

    <!-- Quiz Results Banner when finished -->
    {#if quizResult}
      <div
        style="background: {quizResult.passed ? '#f0fdf4' : '#fff7ed'}; border: 1.5px solid {quizResult.passed ? '#86efac' : '#fdba74'}; border-radius: 16px; padding: 24px 20px; margin-bottom: 24px; text-align: center;"
      >
        {#if quizResult.guestName}
          <div style="font-size: 0.95rem; font-weight: 700; color: #334155; margin-bottom: 4px;">
            Hasil Kuis: {quizResult.guestName}
          </div>
        {/if}
        <h2 style="margin: 0 0 6px 0; font-size: 1.5rem; color: #0f172a;">
          Skor Akhir: <span style="color: {quizResult.passed ? '#15803d' : '#c2410c'}; font-weight: 800;">{quizResult.percentage}%</span>
        </h2>
        <p style="color: #475569; margin: 0 0 20px 0; font-size: 0.94rem;">
          Berhasil menjawab benar <strong>{quizResult.correctAnswers}</strong> dari <strong>{quizResult.totalQuestions}</strong> soal.
        </p>

        <!-- The Prominent Post-Quiz Flashcard Button -->
        <div style="display: flex; flex-direction: column; gap: 10px; max-width: 400px; margin: 0 auto;">
          <button
            onclick={openFlashcards}
            disabled={isLoadingFlashcards}
            class="fl-btn fl-btn-lg"
            style="background: #ea580c; color: #ffffff; border: none; font-weight: 700; width: 100%;"
          >
            <span>{isLoadingFlashcards ? 'Menyiapkan...' : 'Buka Soal dalam Bentuk Flashcard'}</span>
          </button>

          <button
            onclick={retryQuiz}
            class="fl-btn fl-btn-md"
            style="background: #ffffff; color: #334155; border: 1px solid #cbd5e1; font-weight: 600; width: 100%;"
          >
            <span>Ulangi Pengerjaan Kuis</span>
          </button>
        </div>
      </div>
    {/if}

    <!-- Questions List -->
    <div style="display: flex; flex-direction: column; gap: 20px;">
      {#each questions as q, qIndex}
        {@const review = quizResult?.reviews?.find((r) => r.questionId === q.id)}
        <div
          style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 12px;">
            <span style="font-weight: 800; font-size: 0.82rem; color: #0f766e; text-transform: uppercase;">
              Soal {qIndex + 1} dari {questions.length}
            </span>
            {#if review}
              <span
                style="font-size: 0.78rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; background: {review.isCorrect ? '#dcfce7' : '#fee2e2'}; color: {review.isCorrect ? '#15803d' : '#b91c1c'}; white-space: nowrap;"
              >
                {review.isCorrect ? 'Benar' : 'Belum Tepat'}
              </span>
            {/if}
          </div>

          <h3 style="font-size: 1.1rem; color: #0f172a; margin: 0 0 16px 0; line-height: 1.45;">
            {q.question}
          </h3>

          <!-- Options -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            {#each q.options as opt}
              {@const isSelected = userAnswers[q.id] === opt.id}
              {@const isThisCorrect = review?.correctOptionId === opt.id}
              {@const isThisIncorrect = isSelected && !review?.isCorrect}

              <div
                class="quiz-option-card"
                class:selected={isSelected && !review}
                class:correct={review && isThisCorrect}
                class:incorrect={review && isThisIncorrect}
                onclick={() => selectOption(q.id, opt.id)}
                role="button"
                tabindex="0"
                onkeydown={(e) => (e.key === ' ' || e.key === 'Enter') && selectOption(q.id, opt.id)}
              >
                <div
                  style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid {isSelected ? '#0f766e' : '#cbd5e1'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;"
                >
                  {#if isSelected}
                    <div style="width: 10px; height: 10px; border-radius: 50%; background: #0f766e;"></div>
                  {/if}
                </div>
                <div style="font-size: 0.94rem; line-height: 1.45; color: #1e293b;">
                  {opt.text}
                </div>
              </div>
            {/each}
          </div>

          <!-- Explanation after submission -->
          {#if review}
            <div
              style="margin-top: 14px; background: #f8fafc; border-left: 4px solid #0f766e; padding: 12px 14px; border-radius: 6px; font-size: 0.9rem; color: #334155; line-height: 1.5;"
            >
              <strong>Penjelasan:</strong> {review.explanation}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Submit Action Button -->
    {#if !quizResult && questions.length > 0}
      <div style="margin-top: 28px; text-align: center;">
        <button
          onclick={submitQuiz}
          disabled={isSubmitting || Object.keys(userAnswers).length === 0}
          class="fl-btn fl-btn-lg"
          style="background: #0f766e; color: #ffffff; border: none; font-weight: 700; opacity: {Object.keys(userAnswers).length === 0 ? 0.6 : 1};"
        >
          <span>{isSubmitting ? 'Memeriksa Jawaban...' : 'Kirim Jawaban Kuis'}</span>
        </button>
      </div>
    {/if}
  {/if}
</div>
