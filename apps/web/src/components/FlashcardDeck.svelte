<script lang="ts">
  import type { DrillFlashcard } from '../lib/quizMasteryStore';
  import { learningFeedback } from '../lib/learningFeedback.svelte';

  type Rating = 'again' | 'hard' | 'good' | 'easy';
  interface QueueEntry {
    card: DrillFlashcard;
    retryCount: number;
  }

  interface Props {
    flashcards: DrillFlashcard[];
    title?: string;
    onClose?: () => void;
    onCardRated?: (questionId: string, rating: Rating) => void;
  }

  let { flashcards = [], title = 'Flashcard Study Deck', onClose, onCardRated }: Props = $props();

  let queue = $state<QueueEntry[]>([]);
  let currentIndex = $state(0);
  let isFlipped = $state(false);
  let masteredCount = $state(0);
  let requeuedCount = $state(0);
  let streak = $state(0);
  let isFinished = $state(false);
  let isTransitioning = $state(false);

  $effect(() => {
    queue = flashcards.map((card) => ({ card, retryCount: 0 }));
    currentIndex = 0;
    isFlipped = false;
    masteredCount = 0;
    requeuedCount = 0;
    streak = 0;
    isFinished = false;
    isTransitioning = false;
  });

  let currentEntry = $derived(queue[currentIndex]);
  let currentCard = $derived(currentEntry?.card);
  let progressRatio = $derived(
    queue.length > 0 ? (isFinished ? 1 : (currentIndex + 1) / queue.length) : 0
  );

  function flipCard() {
    if (isFinished || isTransitioning || !currentCard) return;
    isFlipped = !isFlipped;
  }

  function handleRating(rating: Rating) {
    if (isFinished || isTransitioning || !currentEntry) return;
    isTransitioning = true;
    onCardRated?.(currentEntry.card.questionId, rating);

    if (rating === 'good' || rating === 'easy') {
      masteredCount++;
      streak++;
      if (currentEntry.retryCount > 0) {
        learningFeedback.onRedemption();
      } else {
        learningFeedback.onCorrect(streak, rating === 'easy');
      }
    } else if (rating === 'again') {
      streak = 0;
      learningFeedback.onMiss();
      if (currentEntry.retryCount < 2) {
        queue = [...queue, { card: currentEntry.card, retryCount: currentEntry.retryCount + 1 }];
        requeuedCount++;
      }
    } else {
      streak = 0;
    }

    isFlipped = false;
    setTimeout(() => {
      if (currentIndex + 1 < queue.length) {
        currentIndex++;
      } else {
        isFinished = true;
        learningFeedback.onCelebration(
          'Dek Flashcard Tuntas!',
          `${masteredCount} kartu berhasil dikuasai dalam sesi ini`
        );
      }
      isTransitioning = false;
    }, 180);
  }

  function restart() {
    queue = flashcards.map((card) => ({ card, retryCount: 0 }));
    currentIndex = 0;
    isFlipped = false;
    masteredCount = 0;
    requeuedCount = 0;
    isFinished = false;
    isTransitioning = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (isFinished || !currentCard) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const keyMap: Record<string, Rating> = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' };
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      flipCard();
    } else if (keyMap[e.key]) {
      e.preventDefault();
      handleRating(keyMap[e.key]);
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flashcard-deck-container" style="padding: 12px 0; max-width: 600px; margin: 0 auto;">
  <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px;">
    <div>
      <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--ws-accent, #0f766e);">{title}</h3>
      <p style="margin: 3px 0 0 0; font-size: 0.84rem; color: #475569;">
        {#if !isFinished && queue.length > 0}
          Kartu {currentIndex + 1} dari {queue.length}
        {:else}
          Sesi Selesai
        {/if}
      </p>
    </div>
    {#if onClose}
      <button
        type="button"
        onclick={onClose}
        class="fl-btn fl-btn-sm"
        style="background: #f1f5f9; border: 1px solid #e2e8f0; color: #334155; font-weight: 600;"
      >
        Tutup
      </button>
    {/if}
  </div>

  {#if !isFinished && currentCard}
    <div style="height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: 18px;">
      <div
        class="fl-progress-bar-fill"
        style="background: var(--ws-accent, #0f766e); transform: scaleX({progressRatio});"
      ></div>
    </div>

    <div
      class="flashcard-scene"
      onclick={flipCard}
      role="button"
      tabindex="0"
      aria-label="Balik kartu flashcard"
      onkeydown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          flipCard();
        }
      }}
    >
      <div class="flashcard-card" class:flipped={isFlipped}>
        <div class="flashcard-face flashcard-front">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="background: #f0fdfa; color: var(--ws-accent, #0f766e); border: 1px solid #99f6e4; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 6px;">
                Pertanyaan
              </span>
              {#if currentCard.topic}
                <span style="background: #f1f5f9; color: #334155; font-size: 0.72rem; font-weight: 600; padding: 3px 8px; border-radius: 999px;">
                  {currentCard.topic}
                </span>
              {/if}
              {#if currentEntry.retryCount > 0}
                <span style="background: #fef3c7; color: #92400e; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                  Diulang
                </span>
              {/if}
            </div>
            <span style="font-size: 0.76rem; color: #475569;">
              Ketuk / <kbd class="fl-kbd-badge">Space</kbd>
            </span>
          </div>

          <div style="flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; padding: 12px 0; overflow-y: auto;">
            <h2 style="font-size: 1.18rem; line-height: 1.45; color: #0f172a; margin: 0;">
              {currentCard.front}
            </h2>
          </div>

          {#if currentCard.hint}
            <div style="background: #f8fafc; border-left: 3px solid var(--ws-accent, #0f766e); padding: 8px 12px; border-radius: 4px; font-size: 0.84rem; color: #334155;">
              <strong>Petunjuk:</strong> {currentCard.hint}
            </div>
          {:else}
            <div style="font-size: 0.76rem; color: #64748b; text-align: center;">Active Recall Mode</div>
          {/if}
        </div>

        <div class="flashcard-face flashcard-back">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <span style="background: #dcfce7; color: #166534; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 6px;">
              Jawaban Benar
            </span>
            <span style="font-size: 0.76rem; color: var(--ws-accent, #0f766e); font-weight: 600;">Ketuk untuk balik</span>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 10px 0; overflow-y: auto;">
            <h2 style="font-size: 1.18rem; font-weight: 700; color: var(--ws-accent, #0f766e); margin: 0 0 10px 0;">
              {currentCard.back}
            </h2>
            {#if currentCard.explanation}
              <p style="font-size: 0.88rem; line-height: 1.5; color: #334155; margin: 0; background: #ffffff; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                {currentCard.explanation}
              </p>
            {/if}
          </div>

          <div style="font-size: 0.75rem; color: #475569; text-align: center;">
            Nilai daya ingatmu (atau tekan tombol 1–4):
          </div>
        </div>
      </div>
    </div>

    <div style="margin-top: 20px;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px;">
        <button type="button" onclick={() => handleRating('again')} class="fl-btn fl-btn-md" style="background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; font-weight: 700; justify-content: space-between;">
          <span>Ulangi</span><kbd class="fl-kbd-badge">1</kbd>
        </button>
        <button type="button" onclick={() => handleRating('hard')} class="fl-btn fl-btn-md" style="background: #ffedd5; color: #9a3412; border: 1px solid #fdba74; font-weight: 700; justify-content: space-between;">
          <span>Sulit</span><kbd class="fl-kbd-badge">2</kbd>
        </button>
        <button type="button" onclick={() => handleRating('good')} class="fl-btn fl-btn-md" style="background: #e0f2fe; color: #075985; border: 1px solid #7dd3fc; font-weight: 700; justify-content: space-between;">
          <span>Bagus</span><kbd class="fl-kbd-badge">3</kbd>
        </button>
        <button type="button" onclick={() => handleRating('easy')} class="fl-btn fl-btn-md" style="background: #dcfce7; color: #166534; border: 1px solid #86efac; font-weight: 700; justify-content: space-between;">
          <span>Mudah</span><kbd class="fl-kbd-badge">4</kbd>
        </button>
      </div>
    </div>
  {:else if isFinished}
    <div class="fl-step-enter" style="background: #ffffff; border-radius: 16px; padding: 26px 20px; text-align: center; border: 1px solid #e2e8f0;">
      <h2 style="margin: 0 0 8px 0; color: var(--ws-accent, #0f766e); font-size: 1.35rem; font-weight: 800;">Sesi Belajar Tuntas</h2>
      <p style="color: #475569; font-size: 0.9rem; margin: 0 0 18px 0;">
        Kamu telah meninjau {flashcards.length} kartu ({requeuedCount > 0 ? `${requeuedCount} kali pengulangan Leitner` : 'tanpa pengulangan'}).
      </p>
      <div style="display: flex; justify-content: center; gap: 14px; margin-bottom: 20px; flex-wrap: wrap;">
        <div style="background: #f0fdfa; padding: 12px 18px; border-radius: 12px; border: 1px solid #ccfbf1;">
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--ws-accent, #0f766e);">{masteredCount}</div>
          <div style="font-size: 0.76rem; color: #115e59; font-weight: 600;">Dikuasai</div>
        </div>
        <div style="background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="font-size: 1.4rem; font-weight: 800; color: #334155;">{flashcards.length}</div>
          <div style="font-size: 0.76rem; color: #475569; font-weight: 600;">Kartu Unik</div>
        </div>
      </div>
      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button type="button" onclick={restart} class="fl-btn fl-btn-md" style="background: var(--ws-accent, #0f766e); color: #ffffff; border: none; font-weight: 700;">
          Review Lagi
        </button>
        {#if onClose}
          <button type="button" onclick={onClose} class="fl-btn fl-btn-md" style="background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; font-weight: 600;">
            Selesai
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <div style="text-align: center; padding: 36px; color: #64748b;">
      Tidak ada kartu flashcard yang tersedia untuk filter ini.
    </div>
  {/if}
</div>
