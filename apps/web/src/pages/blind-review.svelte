<script lang="ts">
  import { onMount } from 'svelte';
  import { Page } from 'framework7-svelte';
  import { api } from '../stores/api';
  import Icon from '../components/ui/Icon.svelte';

  interface Props {
    f7route: {
      params: {
        token: string;
      };
    };
  }

  let { f7route }: Props = $props();
  const token = $derived(f7route.params.token);

  let isLoading = $state(true);
  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);
  let reviewData = $state<any>(null);
  let rubricScores = $state<Record<string, number>>({});
  let reviewerNotes = $state('');
  let submissionResult = $state<any>(null);

  onMount(async () => {
    await loadReview();
  });

  async function loadReview() {
    isLoading = true;
    errorMessage = null;
    try {
      reviewData = await api.consensus.getBlindReview(token);
      // Initialize rubric scores
      if (reviewData?.task?.rubricCriteria) {
        for (const crit of reviewData.task.rubricCriteria) {
          rubricScores[crit.id] = 85; // Default sensible midpoint
        }
      }
    } catch (err: any) {
      errorMessage = err.message || 'Token review tidak valid atau telah kedaluwarsa.';
    } finally {
      isLoading = false;
    }
  }

  async function handleSubmitReview() {
    for (const [key, val] of Object.entries(rubricScores)) {
      if (val === undefined || isNaN(val) || val < 0 || val > 100) {
        alert(`Skor untuk kriteria '${key}' harus antara 0 dan 100.`);
        return;
      }
    }

    isSubmitting = true;
    try {
      const res = await api.consensus.submitBlindReview(token, rubricScores, reviewerNotes);
      submissionResult = res;
    } catch (err: any) {
      alert(`Gagal mengirimkan penilaian: ${err.message}`);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Page name="blind-review">
  <div style="max-width: 760px; margin: 32px auto; padding: 0 16px;">
    {#if isLoading}
      <div style="text-align: center; padding: 48px; color: #64748b;">
        <Icon name="refresh" size={24} />
        <p style="margin-top: 10px; font-weight: 600;">Memuat Berkas Review Double-Blind Terenkripsi...</p>
      </div>
    {:else if errorMessage || !reviewData}
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 28px; text-align: center;">
        <span style="color: #dc2626; display: inline-flex; margin-bottom: 8px;">
          <Icon name="alert-triangle" size={36} />
        </span>
        <h3 style="margin: 0 0 8px; color: #991b1b; font-size: 1.2rem; font-weight: 800;">
          Akses Review Ditolak
        </h3>
        <p style="margin: 0; color: #7f1d1d; font-size: 0.9rem;">
          {errorMessage}
        </p>
      </div>
    {:else if submissionResult}
      <!-- Completed Scorecard Summary -->
      <div style="background: #ffffff; border-radius: 20px; border: 1px solid #bbf7d0; padding: 28px; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
        <div style="width: 56px; height: 56px; border-radius: 28px; background: #dcfce7; color: #166534; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <Icon name="check-circle" size={32} />
        </div>
        <h3 style="margin: 0 0 6px; font-size: 1.25rem; font-weight: 800; color: #0f172a;">
          Penilaian Berhasil Disimpan
        </h3>
        <p style="margin: 0 0 18px; font-size: 0.9rem; color: #475569;">
          Skor rubrik telah disegel ke dalam consensus ledger Gwet AC1/AC2.
        </p>

        <div style="display: inline-block; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.92rem; background: {submissionResult.consensusStatus === 'consensus_approved' ? '#f0fdf4' : '#fffbeb'}; color: {submissionResult.consensusStatus === 'consensus_approved' ? '#166534' : '#b45309'}; border: 1px solid {submissionResult.consensusStatus === 'consensus_approved' ? '#bbf7d0' : '#fde68a'};">
          Status Konsensus: {submissionResult.consensusStatus === 'consensus_approved' ? 'DISETUJUI (CONCORDANT)' : 'MEMERLUKAN ARBITRASE'}
        </div>
      </div>
    {:else}
      <!-- Blind Review Scoring Form -->
      <div style="background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); overflow: hidden;">
        <!-- Header -->
        <div style="background: #0f766e; color: #ffffff; padding: 20px 24px;">
          <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.9;">
            Double-Blind Peer Reviewer Ledger
          </span>
          <h2 style="margin: 4px 0 0; font-size: 1.25rem; font-weight: 800;">
            Penilaian Buta Portofolio & Bukti Kelaikan
          </h2>
        </div>

        <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
          <!-- Task Scenario Card -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <div style="font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px;">
              Skenario Studi Kasus:
            </div>
            <p style="margin: 0; font-size: 0.9rem; color: #1e293b; line-height: 1.5;">
              {reviewData.task?.scenario}
            </p>
          </div>

          <!-- Anonymous Candidate Submission -->
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px;">
            <div style="font-size: 0.75rem; font-weight: 800; color: #0f766e; text-transform: uppercase; margin-bottom: 6px;">
              Karya / Analisis Kandidat (Anonim):
            </div>
            <div style="font-size: 0.88rem; color: #0f172a; line-height: 1.55; white-space: pre-wrap; font-family: sans-serif;">
              {reviewData.attempt?.submissionData?.studentAnswerText || reviewData.attempt?.submissionData?.text || 'Berkas teks terlampir'}
            </div>
          </div>

          <!-- Rubric Criteria Scoring -->
          <div>
            <h4 style="margin: 0 0 12px; font-size: 1rem; font-weight: 800; color: #0f172a;">
              Rubrik Kriteria Penilaian:
            </h4>
            <div style="display: flex; flex-direction: column; gap: 14px;">
              {#each reviewData.task?.rubricCriteria || [] as crit}
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <div style="font-weight: 700; font-size: 0.9rem; color: #0f172a;">
                      {crit.title}
                    </div>
                    <div style="font-size: 0.82rem; font-weight: 800; color: #0f766e;">
                      Skor: {rubricScores[crit.id] || 0} / 100
                    </div>
                  </div>
                  <p style="margin: 0 0 10px; font-size: 0.8rem; color: #64748b;">
                    {crit.description} (Bobot: {crit.weight}%)
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    bind:value={rubricScores[crit.id]}
                    style="width: 100%; accent-color: #0f766e;"
                  />
                </div>
              {/each}
            </div>
          </div>

          <!-- Reviewer Qualitative Notes -->
          <div>
            <label for="rev-notes" style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 6px;">
              Catatan Kualitatif / Argumen Penilaian:
            </label>
            <textarea
              id="rev-notes"
              rows="3"
              placeholder="Berikan umpan balik obyektif terhadap kekuatan atau celah pemenuhan standar..."
              bind:value={reviewerNotes}
              style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.88rem; line-height: 1.45;"
            ></textarea>
          </div>

          <!-- Submit Button -->
          <div style="display: flex; justify-content: flex-end; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            <button
              disabled={isSubmitting}
              onclick={handleSubmitReview}
              class="fl-btn fl-btn-lg"
              style="background: #0f766e; color: #ffffff; border: none; font-weight: 700; font-size: 0.92rem; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);"
            >
              <Icon name="check-circle" size={16} />
              <span>{isSubmitting ? 'Menyimpan Penilaian...' : 'Kirim Nilai Review Double-Blind'}</span>
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</Page>
