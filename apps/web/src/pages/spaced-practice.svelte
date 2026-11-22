<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { onMount } from 'svelte';
  import { api } from '../stores/api';
  import type { SpacedFlashcard } from '@flashlearn/shared';

  let cards = $state<SpacedFlashcard[]>([]);
  let currentIndex = $state(0);
  let isFlipped = $state(false);
  let isLoading = $state(true);
  let isSubmitting = $state(false);

  onMount(() => {
    loadDueCards();
  });

  async function loadDueCards() {
    isLoading = true;
    try {
      const res = await api.spaced.getDue();
      cards = res.data || [];
      currentIndex = 0;
      isFlipped = false;
    } catch (err: any) {
      console.error('Failed to load due cards:', err);
    } finally {
      isLoading = false;
    }
  }

  let currentCard = $derived(cards[currentIndex] || null);

  async function handleGrade(quality: number) {
    if (!currentCard || isSubmitting) return;
    isSubmitting = true;
    try {
      await api.spaced.practice(currentCard.id, quality);
      isFlipped = false;
      currentIndex += 1;
    } catch (err: any) {
      alert(`Gagal menyimpan evaluasi: ${err.message}`);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Page name="spaced-practice">
  <div style="max-width: 680px; margin: 0 auto; padding: 24px 16px;">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
      <div>
        <span style="font-size: 0.78rem; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.04em;">
          SM-2 Spaced Retrieval
        </span>
        <h2 style="margin: 2px 0 0; font-size: 1.4rem; font-weight: 800; color: #0f172a;">
          Latihan Retensi Bertahap
        </h2>
      </div>

      {#if cards.length > 0 && currentIndex < cards.length}
        <span style="font-size: 0.85rem; font-weight: 700; color: #0f766e; background: #ccfbf1; padding: 4px 10px; border-radius: 8px; white-space: nowrap;">
          {currentIndex + 1} / {cards.length}
        </span>
      {/if}
    </div>

    {#if isLoading}
      <div style="text-align: center; padding: 48px; color: #475569; font-weight: 500;">
        Menyiapkan kartu latihan hari ini...
      </div>
    {:else if cards.length === 0 || currentIndex >= cards.length}
      <div style="text-align: center; padding: 44px 24px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 8px; font-size: 1.25rem; font-weight: 800; color: #0f172a;">
          Latihan Hari Ini Selesai
        </h3>
        <p style="margin: 0 0 20px; font-size: 0.9rem; color: #475569; line-height: 1.55;">
          Semua memori aktif Anda telah diperbarui sesuai algoritma SM-2. Silakan kembali besok untuk jadwal repetisi berikutnya.
        </p>
        <button
          onclick={loadDueCards}
          class="fl-btn fl-btn-md"
          style="background: #0f766e; color: #ffffff; border: none; font-weight: 700;"
        >
          Periksa Kartu Baru
        </button>
      </div>
    {:else if currentCard}
      <!-- 3D Flashcard -->
      <div
        role="button"
        tabindex="0"
        onclick={() => (isFlipped = !isFlipped)}
        onkeydown={(e) => (e.key === ' ' || e.key === 'Enter') && (isFlipped = !isFlipped)}
        style="min-height: 250px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 20px;"
      >
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: uppercase;">
            {isFlipped ? 'Kunci Jawaban & Rujukan' : 'Pertanyaan / Kasus'}
          </span>
          <span style="font-size: 0.76rem; color: #64748b;">
            Klik kartu untuk membalik
          </span>
        </div>

        <div style="font-size: 1.12rem; font-weight: 700; color: #0f172a; text-align: center; padding: 20px 0; line-height: 1.5;">
          {#if isFlipped}
            <div style="color: #0f766e; margin-bottom: 12px;">
              {currentCard.back}
            </div>
            {#if currentCard.explanation}
              <div style="font-size: 0.86rem; font-weight: 500; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 10px; text-align: left;">
                {currentCard.explanation}
              </div>
            {/if}
          {:else}
            {currentCard.front}
          {/if}
        </div>

        <div style="font-size: 0.76rem; text-align: center; color: #64748b;">
          Interval SM-2: {currentCard.intervalDays} hari · Repetisi: {currentCard.repetitions}x
        </div>
      </div>

      <!-- Rating Controls -->
      {#if isFlipped}
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px;">
          <button
            disabled={isSubmitting}
            onclick={() => handleGrade(0)}
            class="fl-btn fl-btn-md"
            style="border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; font-weight: 700;"
          >
            0 · Blank
          </button>
          <button
            disabled={isSubmitting}
            onclick={() => handleGrade(3)}
            class="fl-btn fl-btn-md"
            style="border: 1px solid #fed7aa; background: #fff7ed; color: #c2410c; font-weight: 700;"
          >
            3 · Sulit
          </button>
          <button
            disabled={isSubmitting}
            onclick={() => handleGrade(4)}
            class="fl-btn fl-btn-md"
            style="border: 1px solid #bae6fd; background: #f0f9ff; color: #0369a1; font-weight: 700;"
          >
            4 · Bagus
          </button>
          <button
            disabled={isSubmitting}
            onclick={() => handleGrade(5)}
            class="fl-btn fl-btn-md"
            style="border: 1px solid #bbf7d0; background: #f0fdf4; color: #15803d; font-weight: 700;"
          >
            5 · Sempurna
          </button>
        </div>
      {:else}
        <div style="text-align: center; color: #475569; font-size: 0.86rem; font-weight: 600;">
          Pikirkan jawaban Anda, lalu klik kartu untuk melihat hasil dan menilai retensi.
        </div>
      {/if}
    {/if}
  </div>
</Page>
