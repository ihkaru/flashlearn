<script lang="ts">
  import { api } from '../../stores/api';
  import { lumisChat } from '../../stores/lumisChat.svelte';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    isOpen: boolean;
    workspaceId: string;
    onClose: () => void;
    onCompleted?: () => void;
  }

  let { isOpen, workspaceId, onClose, onCompleted }: Props = $props();

  let isStarting = $state(false);
  let isSubmitting = $state(false);
  let session = $state<any>(null);
  let currentProbe = $state<any>(null);
  let isFinished = $state(false);
  let completionData = $state<any>(null);
  let calculatedInput = $state<string>('');
  let lastProbeResult = $state<any>(null);

  $effect(() => {
    if (isOpen && !session && !isStarting && !isFinished) {
      startSession();
    }
  });

  async function startSession() {
    isStarting = true;
    lastProbeResult = null;
    try {
      const res = await api.diagnostic.start(workspaceId);
      session = res.session || res;
      await fetchNextProbe(session.id);
    } catch (err: any) {
      alert(`Gagal memulai sesi diagnostik: ${err.message}`);
      onClose();
    } finally {
      isStarting = false;
    }
  }

  async function fetchNextProbe(sessionId: string) {
    try {
      const res = await api.diagnostic.getNextProbe(sessionId);
      if (res.finished) {
        isFinished = true;
        completionData = res;
        onCompleted?.();
      } else {
        currentProbe = res;
        calculatedInput = '';
      }
    } catch (err: any) {
      alert(`Gagal mengambil probe diagnostik: ${err.message}`);
    }
  }

  async function handleSubmitProbe() {
    if (!calculatedInput && calculatedInput !== '0') {
      alert('Masukkan jawaban perhitungan atau solusi probe terlebih dahulu.');
      return;
    }

    if (!session?.id) {
      alert('Sesi diagnostik tidak ditemukan.');
      return;
    }

    isSubmitting = true;
    try {
      const numVal = Number(calculatedInput);
      const submission: Record<string, any> = {
        calculatedValue: !isNaN(numVal) ? numVal : calculatedInput,
      };

      if (currentProbe?.task?.oracleData?.targetField) {
        submission[currentProbe.task.oracleData.targetField] = !isNaN(numVal) ? numVal : calculatedInput;
      }

      const res = await api.diagnostic.submitProbe(session.id, submission);
      lastProbeResult = res;

      if (res.sessionFinished) {
        isFinished = true;
        completionData = res;
        onCompleted?.();
      } else {
        await fetchNextProbe(session.id);
      }
    } catch (err: any) {
      alert(`Gagal mengirim jawaban probe: ${err.message}`);
    } finally {
      isSubmitting = false;
    }
  }

  function handleReset() {
    session = null;
    currentProbe = null;
    isFinished = false;
    completionData = null;
    lastProbeResult = null;
    onClose();
  }
</script>

{#if isOpen}
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(4px);"
    onclick={handleReset}
    onkeydown={(e) => e.key === 'Escape' && handleReset()}
  >
    <div
      style="background: #ffffff; width: 100%; max-width: 640px; max-height: 90vh; border-radius: 20px; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden;"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div style="padding: 18px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
        <div>
          <span style="font-size: 0.72rem; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.05em;">
            Knowledge Space Theory (KST)
          </span>
          <h3 style="margin: 2px 0 0; font-size: 1.15rem; font-weight: 800; color: #0f172a;">
            Uji Penempatan Diagnostik Topologis
          </h3>
        </div>
        <button
          onclick={handleReset}
          style="border: none; background: #e2e8f0; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #475569;"
        >
          <Icon name="xmark" size={16} />
        </button>
      </div>

      <!-- Body Content -->
      <div style="padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;">
        {#if isStarting}
          <div style="text-align: center; padding: 48px; color: #64748b;">
            <Icon name="refresh" size={24} />
            <p style="margin-top: 10px; font-weight: 600;">Menginisialisasi Topological DAG Fringe...</p>
          </div>
        {:else if isFinished}
          <div style="text-align: center; padding: 20px 10px;">
            <div style="width: 56px; height: 56px; border-radius: 28px; background: #dcfce7; color: #166534; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
              <Icon name="check-circle" size={32} />
            </div>
            <h4 style="margin: 0 0 8px; font-size: 1.25rem; font-weight: 800; color: #0f172a;">
              Penempatan Diagnostik Tuntas!
            </h4>
            <p style="margin: 0 0 18px; font-size: 0.9rem; color: #475569; line-height: 1.5;">
              Posisi pengetahuan Anda telah dipetakan secara matematis pada Knowledge Space DAG. Prasyarat terinferensi telah diperbarui secara otomatis.
            </p>
            {#if completionData?.session?.inferredMasteryCount !== undefined}
              <div style="display: inline-block; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 18px; border-radius: 10px; font-weight: 700; color: #166534; font-size: 0.9rem; margin-bottom: 20px;">
                Total Kompetensi Terinferensi: {completionData.session.inferredMasteryCount}
              </div>
            {/if}
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
              <button
                onclick={() => {
                  lumisChat.askDiagnosticGuide({
                    workspaceName: 'Workspace Aktif',
                    inferredCount: completionData?.session?.inferredMasteryCount || 0,
                  });
                  handleReset();
                }}
                style="background: #ffffff; border: 1.5px solid #0f766e; color: #0f766e; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"
              >
                <Icon name="chat" size={15} />
                <span>Konsultasi Peta Belajar (AI)</span>
              </button>
              <button
                onclick={handleReset}
                style="background: #0f766e; color: #ffffff; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer;"
              >
                Lihat Peta Kompetensi Terbaru
              </button>
            </div>
          </div>
        {:else if currentProbe}
          <!-- Active Probe Card -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-family: monospace; font-size: 0.75rem; font-weight: 700; color: #0f766e; background: #ccfbf1; padding: 2px 7px; border-radius: 6px;">
                {currentProbe.competency?.code || 'PROBE'}
              </span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #64748b;">
                Tingkat Kesulitan: {currentProbe.difficultyLevel || 'Standard'}
              </span>
            </div>
            <h4 style="margin: 0 0 6px; font-size: 1rem; font-weight: 800; color: #0f172a;">
              {currentProbe.competency?.title}
            </h4>
            <p style="margin: 0 0 12px; font-size: 0.88rem; color: #334155; line-height: 1.45;">
              {currentProbe.task?.scenario || currentProbe.competency?.description}
            </p>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
              <label for="probe-calc" style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 6px;">
                Jawaban Nilai Perhitungan / Verifikasi:
              </label>
              <input
                id="probe-calc"
                type="text"
                placeholder="Masukkan nilai angka..."
                bind:value={calculatedInput}
                style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.95rem; font-family: monospace;"
                onkeydown={(e) => e.key === 'Enter' && handleSubmitProbe()}
              />
            </div>
          </div>

          {#if lastProbeResult}
            <div style="padding: 10px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: 600; background: {lastProbeResult.passed ? '#f0fdf4' : '#fef2f2'}; color: {lastProbeResult.passed ? '#166534' : '#991b1b'}; border: 1px solid {lastProbeResult.passed ? '#bbf7d0' : '#fecaca'};">
              {lastProbeResult.passed ? '✓ Jawaban Tepat! Melakukan inferensi Bayesian ke node turunan...' : '✕ Deviasi terdeteksi. Mengarahkan probe ke node prasyarat dasar...'}
            </div>
          {/if}

          <button
            disabled={isSubmitting}
            onclick={handleSubmitProbe}
            style="background: #0f766e; color: #ffffff; border: none; padding: 12px 18px; border-radius: 10px; font-weight: 700; font-size: 0.92rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;"
          >
            <Icon name="check" size={16} />
            <span>{isSubmitting ? 'Memproses Inferensi...' : 'Kirim Jawaban Probe'}</span>
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
