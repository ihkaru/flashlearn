<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { onMount } from 'svelte';
  import { api } from '../stores/api';
  import type { PendingReviewItem } from '../stores/api/reviewer';
  import ReviewCard from '../components/reviewer/ReviewCard.svelte';
  import Icon from '../components/ui/Icon.svelte';

  let items = $state<PendingReviewItem[]>([]);
  let isLoading = $state(true);
  let errorMessage = $state<string | null>(null);

  onMount(() => {
    loadPendingReviews();
  });

  async function loadPendingReviews() {
    isLoading = true;
    errorMessage = null;
    try {
      const res = await api.reviewer.getPending();
      items = res.data || [];
    } catch (err: any) {
      errorMessage = err.message || 'Gagal memuat antrean penilai';
    } finally {
      isLoading = false;
    }
  }

  async function handleEvaluate(attemptId: string, passed: boolean, rubricScores: any[], notes: string) {
    try {
      await api.reviewer.evaluate({
        attemptId,
        passed,
        rubricScores,
        expertNotes: notes,
      });
      alert('Verifikasi pakar berhasil dicatat dalam audit trail!');
      await loadPendingReviews();
    } catch (err: any) {
      alert(`Gagal menyimpan evaluasi: ${err.message}`);
    }
  }
</script>

<Page name="reviewer-queue">
  <div style="max-width: 860px; margin: 0 auto; padding: 24px 16px;">
    <!-- Page Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <div style="width: 28px; height: 28px; border-radius: 8px; background: #faf5ff; color: #7e22ce; display: flex; align-items: center; justify-content: center;">
            <Icon name="award" size={16} />
          </div>
          <span style="font-size: 0.8rem; font-weight: 700; color: #7e22ce; text-transform: uppercase;">
            Oracle Kelas C
          </span>
        </div>
        <h2 style="margin: 0; font-size: 1.45rem; font-weight: 800; color: #0f172a;">
          Antrean Penilai Pakar Manusia
        </h2>
        <p style="margin: 4px 0 0; font-size: 0.875rem; color: #64748b;">
          Sesuai Invarian 4: Penilaian tugas Kelas C wajib ditandatangani oleh pakar manusia independen.
        </p>
      </div>

      <button
        onclick={loadPendingReviews}
        style="padding: 8px 14px; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; font-size: 0.85rem; font-weight: 600; color: #475569; cursor: pointer; display: flex; align-items: center; gap: 6px;"
      >
        <Icon name="refresh" size={14} />
        <span>Segarkan</span>
      </button>
    </div>

    <!-- Content Area -->
    {#if isLoading}
      <div style="text-align: center; padding: 48px; color: #94a3b8; font-weight: 500;">
        Memeriksa antrean pengajuan...
      </div>
    {:else if errorMessage}
      <div style="padding: 16px; border-radius: 12px; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; font-size: 0.9rem;">
        {errorMessage}
      </div>
    {:else if items.length === 0}
      <div style="text-align: center; padding: 48px; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px;">
        <div style="color: #94a3b8; margin-bottom: 8px;">
          <Icon name="check-circle" size={32} />
        </div>
        <h4 style="margin: 0 0 4px; font-size: 1.05rem; font-weight: 700; color: #334155;">
          Semua Pengajuan Telah Ditinjau!
        </h4>
        <p style="margin: 0; font-size: 0.85rem; color: #64748b;">
          Tidak ada tugas Kelas C yang menunggu penilaian pakar saat ini.
        </p>
      </div>
    {:else}
      <div style="display: flex; flex-direction: column; gap: 16px;">
        {#each items as item (item.attempt.id)}
          <ReviewCard {item} onEvaluate={handleEvaluate} />
        {/each}
      </div>
    {/if}
  </div>
</Page>
