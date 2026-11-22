<script lang="ts">
  import type { FlashcardItem } from '@flashlearn/shared';
  import { Progressbar } from 'framework7-svelte';

  interface Props {
    flashcards: FlashcardItem[];
    title?: string;
    onClose?: () => void;
  }

  let { flashcards = [], title = 'Flashcard Study Deck', onClose }: Props = $props();

  let currentIndex = $state(0);
  let isFlipped = $state(false);
  let studiedCount = $state(0);
  let masteredCount = $state(0);
  let isFinished = $state(false);

  let currentCard = $derived(flashcards[currentIndex]);
  let progress = $derived(
    flashcards.length > 0 ? Math.round(((currentIndex + 1) / flashcards.length) * 100) : 0
  );

  function flipCard() {
    isFlipped = !isFlipped;
  }

  function handleRating(rating: 'again' | 'hard' | 'good' | 'easy') {
    studiedCount++;
    if (rating === 'good' || rating === 'easy') {
      masteredCount++;
    }

    isFlipped = false;

    // Small delay for flip animation before moving to next card
    setTimeout(() => {
      if (currentIndex + 1 < flashcards.length) {
        currentIndex++;
      } else {
        isFinished = true;
      }
    }, 200);
  }

  function restart() {
    currentIndex = 0;
    isFlipped = false;
    studiedCount = 0;
    masteredCount = 0;
    isFinished = false;
  }
</script>

<div class="flashcard-deck-container" style="padding: 16px; max-width: 600px; margin: 0 auto;">
  <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px;">
    <div>
      <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f766e;">{title}</h3>
      <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #475569;">
        {#if !isFinished}
          Kartu {currentIndex + 1} dari {flashcards.length}
        {:else}
          Sesi Selesai
        {/if}
      </p>
    </div>
    {#if onClose}
      <button
        onclick={onClose}
        class="fl-btn fl-btn-sm"
        style="background: #f1f5f9; border: 1px solid #e2e8f0; color: #334155;"
      >
        Tutup
      </button>
    {/if}
  </div>

  {#if !isFinished && flashcards.length > 0}
    <!-- Progress Bar -->
    <div style="margin-bottom: 20px;">
      <Progressbar progress={progress} color="teal" />
    </div>

    <!-- 3D Flippable Flashcard -->
    <div
      class="flashcard-scene"
      onclick={flipCard}
      role="button"
      tabindex="0"
      onkeydown={(e) => (e.key === ' ' || e.key === 'Enter') && flipCard()}
    >
      <div class="flashcard-card" class:flipped={isFlipped}>
        <!-- FRONT FACE -->
        <div class="flashcard-face flashcard-front">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <span
              style="background: #e0f2fe; color: #0369a1; font-size: 0.74rem; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 6px;"
            >
              Pertanyaan
            </span>
            <span style="font-size: 0.78rem; color: #475569;">Ketuk untuk lihat jawaban</span>
          </div>

          <div style="flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; padding: 12px 0;">
            <h2 style="font-size: 1.25rem; line-height: 1.45; color: #0f172a; margin: 0;">
              {currentCard.front}
            </h2>
          </div>

          {#if currentCard.hint}
            <div style="background: #f8fafc; border-left: 3px solid #0f766e; padding: 8px 12px; border-radius: 4px; font-size: 0.85rem; color: #334155;">
              <strong>Petunjuk:</strong> {currentCard.hint}
            </div>
          {:else}
            <div style="font-size: 0.78rem; color: #64748b; text-align: center;">
              Active Recall Mode
            </div>
          {/if}
        </div>

        <!-- BACK FACE -->
        <div class="flashcard-face flashcard-back">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <span
              style="background: #dcfce7; color: #15803d; font-size: 0.74rem; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 6px;"
            >
              Jawaban Benar
            </span>
            <span style="font-size: 0.78rem; color: #0f766e; font-weight: 600;">Ketuk untuk balik</span>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 12px 0;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f766e; margin: 0 0 12px 0;">
              {currentCard.back}
            </h2>
            {#if currentCard.explanation}
              <p style="font-size: 0.9rem; line-height: 1.5; color: #334155; margin: 0; background: #ffffff; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
                {currentCard.explanation}
              </p>
            {/if}
          </div>

          <div style="font-size: 0.76rem; color: #475569; text-align: center;">
            Evaluasi daya ingatmu di bawah ini:
          </div>
        </div>
      </div>
    </div>

    <!-- Rating Actions Bar (Spaced Repetition Buttons) -->
    <div style="margin-top: 22px;">
      <div style="font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 8px; text-align: center;">
        Tingkat Penguasaan Materi:
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px;">
        <button
          onclick={() => handleRating('again')}
          class="fl-btn fl-btn-md"
          style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; font-weight: 700;"
        >
          Ulangi
        </button>
        <button
          onclick={() => handleRating('hard')}
          class="fl-btn fl-btn-md"
          style="background: #ffedd5; color: #c2410c; border: 1px solid #fdba74; font-weight: 700;"
        >
          Sulit
        </button>
        <button
          onclick={() => handleRating('good')}
          class="fl-btn fl-btn-md"
          style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; font-weight: 700;"
        >
          Bagus
        </button>
        <button
          onclick={() => handleRating('easy')}
          class="fl-btn fl-btn-md"
          style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; font-weight: 700;"
        >
          Mudah
        </button>
      </div>
    </div>
  {:else if isFinished}
    <!-- Session Complete Card -->
    <div style="background: #ffffff; border-radius: 16px; padding: 28px 22px; text-align: center; border: 1px solid #e2e8f0;">
      <h2 style="margin: 0 0 8px 0; color: #0f766e; font-size: 1.4rem;">Sesi Belajar Tuntas</h2>
      <p style="color: #475569; font-size: 0.92rem; margin: 0 0 20px 0;">
        Kamu telah mereview seluruh {flashcards.length} kartu soal dengan metode active recall.
      </p>

      <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;">
        <div style="background: #f0fdfa; padding: 12px 20px; border-radius: 12px; border: 1px solid #ccfbf1;">
          <div style="font-size: 1.45rem; font-weight: 800; color: #0f766e;">{masteredCount}</div>
          <div style="font-size: 0.76rem; color: #115e59; font-weight: 600;">Dikuasai</div>
        </div>
        <div style="background: #f8fafc; padding: 12px 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="font-size: 1.45rem; font-weight: 800; color: #334155;">{flashcards.length}</div>
          <div style="font-size: 0.76rem; color: #475569; font-weight: 600;">Total Kartu</div>
        </div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button
          onclick={restart}
          class="fl-btn fl-btn-md"
          style="background: #0f766e; color: #ffffff; border: none; font-weight: 700;"
        >
          Review Lagi
        </button>
        {#if onClose}
          <button
            onclick={onClose}
            class="fl-btn fl-btn-md"
            style="background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; font-weight: 600;"
          >
            Selesai
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <div style="text-align: center; padding: 40px; color: #94a3b8;">
      Tidak ada kartu flashcard yang tersedia.
    </div>
  {/if}
</div>
