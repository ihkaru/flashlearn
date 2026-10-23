<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { onMount } from 'svelte';
  import { api } from '../stores/api';
  import type { SpacedFlashcard } from '@flashlearn/shared';
  import Icon from '../components/ui/Icon.svelte';

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
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <div style="width: 28px; height: 28px; border-radius: 8px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center;">
            <Icon name="bolt" size={16} />
          </div>
          <span style="font-size: 0.8rem; font-weight: 700; color: #0284c7; text-transform: uppercase;">
            SM-2 Spaced Retrieval
          </span>
        </div>
        <h2 style="margin: 0; font-size: 1.45rem; font-weight: 800; color: #0f172a;">
          Latihan Retensi Bertahap
        </h2>
      </div>

      {#if cards.length > 0 && currentIndex < cards.length}
        <span style="font-size: 0.85rem; font-weight: 700; color: #0f766e; background: #ccfbf1; padding: 4px 10px; border-radius: 8px;">
          {currentIndex + 1} / {cards.length}
        </span>
      {/if}
    </div>

    {#if isLoading}
      <div style="text-align: center; padding: 48px; color: #94a3b8; font-weight: 500;">
        Menyiapkan kartu latihan hari ini...
      </div>
    {:else if cards.length === 0 || currentIndex >= cards.length}
      <div style="text-align: center; padding: 48px 24px; background: #ffffff; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #e2e8f0;">
        <div style="width: 56px; height: 56px; border-radius: 16px; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <Icon name="check-circle" size={32} />
        </div>
        <h3 style="margin: 0 0 8px; font-size: 1.25rem; font-weight: 800; color: #0f172a;">
          Latihan Hari Ini Selesai!
        </h3>
        <p style="margin: 0 0 20px; font-size: 0.9rem; color: #64748b; line-height: 1.5;">
          Semua memori aktif Anda telah diperbarui sesuai algoritma SM-2. Silakan kembali besok untuk jadwal repetisi berikutnya.
        </p>
        <button
          onclick={loadDueCards}
          style="background: #0f766e; color: #ffffff; border: none; padding: 9px 18px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer;"
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
        onkeydown={(e) => e.key === ' ' && (isFlipped = !isFlipped)}
        style="min-height: 260px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; box-shadow: 0 8px 20px rgba(0,0,0,0.04); cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 24px; transition: all 0.2s ease;"
      >
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
            {isFlipped ? 'Kunci Jawaban & Rujukan' : 'Pertanyaan / Kasus'}
          </span>
          <span style="font-size: 0.75rem; color: #94a3b8; display: flex; align-items: center; gap: 4px;">
            <Icon name="refresh" size={12} />
            Klik kartu untuk membalik
          </span>
        </div>

        <div style="font-size: 1.15rem; font-weight: 700; color: #0f172a; text-align: center; padding: 20px 0; line-height: 1.5;">
          {#if isFlipped}
            <div style="color: #0f766e; margin-bottom: 12px;">
              {currentCard.back}
            </div>
            {#if currentCard.explanation}
              <div style="font-size: 0.85rem; font-weight: 500; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 10px; text-align: left;">
                {currentCard.explanation}
              </div>
            {/if}
          {:else}
            {currentCard.front}
          {/if}
        </div>

        <div style="font-size: 0.75rem; text-align: center; color: #94a3b8;">
          Interval SM-2 saat ini: {currentCard.intervalDays} hari · Repetisi: {currentCard.repetitions}x
        </div>
      </div>

      <!-- Rating Controls -->
      {#if isFlipped}
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
          <button
            disabled={isSubmitting}
            onclick={() => handleGrade(0)}
            style="padding: 10px 4px; border-radius: 10px; border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; font-weight: 700; font-size: 0.8rem; cursor: pointer;"
          >
            0 · Blank
          </button>
          <button
            disabled={isSubmitting}
            onclick={() => handleGrade(3)}
            style="padding: 10px 4px; border-radius: 10px; border: 1px solid #fed7aa; background: #fff7ed; color: #c2410c; font-weight: 700; font-size: 0.8rem; cursor: pointer;"
          >
            3 · Sulit
          </button>
          <button
            disabled={isSubmitting}
            onclick={() => handleGrade(4)}
            style="padding: 10px 4px; border-radius: 10px; border: 1px solid #bae6fd; background: #f0f9ff; color: #0369a1; font-weight: 700; font-size: 0.8rem; cursor: pointer;"
          >
            4 · Bagus
          </button>
          <button
            disabled={isSubmitting}
            onclick={() => handleGrade(5)}
            style="padding: 10px 4px; border-radius: 10px; border: 1px solid #bbf7d0; background: #f0fdf4; color: #15803d; font-weight: 700; font-size: 0.8rem; cursor: pointer;"
          >
            5 · Sempurna
          </button>
        </div>
      {:else}
        <div style="text-align: center; color: #64748b; font-size: 0.85rem; font-weight: 600;">
          Pikirkan jawaban Anda, lalu klik kartu untuk melihat hasil dan menilai retensi.
        </div>
      {/if}
    {/if}
  </div>
</Page>
