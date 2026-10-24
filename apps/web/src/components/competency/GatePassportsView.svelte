<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '../../stores/api';
  import { auth } from '../../stores/auth.svelte';
  import type { Gate, UserGateGrant } from '@flashlearn/shared';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    workspaceId: string;
  }

  let { workspaceId }: Props = $props();

  let gates = $state<Gate[]>([]);
  let grants = $state<UserGateGrant[]>([]);
  let isLoading = $state(true);
  let evaluatingGateId = $state<string | null>(null);
  let issuingGateId = $state<string | null>(null);
  let issuedVc = $state<any>(null);
  let showVcModal = $state(false);
  let copiedVcJson = $state(false);

  onMount(() => {
    loadGates();
  });

  async function loadGates() {
    isLoading = true;
    try {
      const [gatesRes, grantsRes] = await Promise.all([
        api.gates.listByWorkspace(workspaceId),
        api.gates.getPassports(workspaceId),
      ]);
      gates = gatesRes.data || [];
      grants = grantsRes.data || [];
    } catch (err: any) {
      console.error('Failed to load gates:', err);
    } finally {
      isLoading = false;
    }
  }

  async function handleEvaluateGate(gateId: string) {
    evaluatingGateId = gateId;
    try {
      const res = await api.gates.evaluate(gateId);
      if (res.grant.status === 'active') {
        alert('Selamat! Anda memenuhi syarat dan resmi memegang Paspor Otorisasi untuk tingkat ini.');
      } else {
        alert(`Status evaluasi: ${res.grant.status}. Pastikan semua prasyarat kompetensi telah tuntas.`);
      }
      await loadGates();
    } catch (err: any) {
      alert(`Evaluasi gagal: ${err.message}`);
    } finally {
      evaluatingGateId = null;
    }
  }

  async function handleExportVc(gateId: string) {
    if (!auth.user?.id) {
      alert('Silakan login terlebih dahulu untuk menerbitkan kredensial.');
      return;
    }

    issuingGateId = gateId;
    try {
      const res = await api.credentials.issue(gateId, auth.user.id);
      issuedVc = res.credential || res;
      showVcModal = true;
    } catch (err: any) {
      if (err.message && err.message.includes('COMPETENCY_DRIFT_UNSTABLE')) {
        alert(`PENERBITAN DITOLAK: ${err.message}\n\nSalah satu kompetensi Anda telah mengalami peluruhan retensi (R < 0.85). Selesaikan tantangan revalidasi terlebih dahulu pada tab Peta Kompetensi.`);
      } else {
        alert(`Gagal menerbitkan kredensial W3C: ${err.message}`);
      }
    } finally {
      issuingGateId = null;
    }
  }

  function downloadVcJson() {
    if (!issuedVc) return;
    const blob = new Blob([JSON.stringify(issuedVc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credential-${issuedVc.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyVcJson() {
    if (!issuedVc) return;
    navigator.clipboard.writeText(JSON.stringify(issuedVc, null, 2));
    copiedVcJson = true;
    setTimeout(() => (copiedVcJson = false), 2000);
  }

  function getLevelMeta(level: number) {
    switch (level) {
      case 0:
        return { label: 'Tingkat 0 · Observasi', color: '#0f766e', desc: 'Lulus kuis & evaluasi dasar (Kelas A)' };
      case 1:
        return { label: 'Tingkat 1 · Kerja Review Penuh', color: '#0284c7', desc: 'Kasus lampau diselesaikan sesuai Oracle (Kelas B)' };
      case 2:
        return { label: 'Tingkat 2 · Mandiri Risiko Rendah', color: '#7c3aed', desc: 'Tugas nyata risiko rendah mandiri' };
      case 3:
        return { label: 'Tingkat 3 · Mandiri Risiko Tinggi', color: '#dc2626', desc: 'Tugas kompleks diverifikasi langsung oleh Pakar Manusia' };
      default:
        return { label: `Tingkat ${level}`, color: '#475569', desc: '' };
    }
  }
</script>

<div class="gate-passports-container" style="display: flex; flex-direction: column; gap: 16px;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <div>
      <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a;">
        Gerbang Otorisasi & Paspor Wewenang
      </h3>
      <p style="margin: 4px 0 0; font-size: 0.85rem; color: #64748b;">
        Wewenang diberikan bertahap berdasarkan bukti kompetensi yang diverifikasi, bukan waktu belajar.
      </p>
    </div>
    <button
      onclick={loadGates}
      style="padding: 6px 12px; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; font-size: 0.8rem; font-weight: 600; color: #475569; cursor: pointer; display: flex; align-items: center; gap: 5px;"
    >
      <Icon name="refresh" size={13} />
      <span>Segarkan</span>
    </button>
  </div>

  {#if isLoading}
    <div style="text-align: center; padding: 40px; color: #94a3b8; font-weight: 500;">
      Memeriksa paspor otorisasi...
    </div>
  {:else if gates.length === 0}
    <div style="text-align: center; padding: 40px; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px;">
      <p style="margin: 0; color: #64748b; font-weight: 600;">Belum ada gerbang otorisasi yang dikonfigurasi pada workspace ini.</p>
    </div>
  {:else}
    <div style="display: flex; flex-direction: column; gap: 12px;">
      {#each gates.sort((a, b) => a.level - b.level) as gate}
        {@const meta = getLevelMeta(gate.level)}
        {@const grant = grants.find((g) => g.gateId === gate.id)}
        {@const isActive = grant?.status === 'active'}
        {@const isSuspended = grant?.status === 'suspended'}
        <div
          style="background: #ffffff; border: 1px solid {isActive ? meta.color : '#e2e8f0'}; border-radius: 14px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 10px;"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div
                style="width: 36px; height: 36px; border-radius: 10px; background: {isActive ? meta.color : '#f1f5f9'}; color: {isActive ? '#ffffff' : '#64748b'}; display: flex; align-items: center; justify-content: center;"
              >
                <Icon name={isActive ? 'shield-check' : 'shield'} size={18} />
              </div>
              <div>
                <h4 style="margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a;">
                  {gate.title}
                </h4>
                <span style="font-size: 0.78rem; font-weight: 700; color: {meta.color};">
                  {meta.label}
                </span>
              </div>
            </div>

            <div>
              {#if isActive}
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <span style="background: #dcfce7; color: #15803d; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                    <Icon name="check" size={12} />
                    Paspor Aktif
                  </span>

                  <button
                    disabled={issuingGateId === gate.id}
                    onclick={() => handleExportVc(gate.id)}
                    style="background: #0f766e; color: #ffffff; border: none; padding: 5px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"
                  >
                    <Icon name="shield-check" size={12} />
                    <span>{issuingGateId === gate.id ? 'Menerbitkan...' : 'Ekspor W3C VC 2.0'}</span>
                  </button>

                  {#if grant}
                    <a
                      href="/#/verify/{grant.id}"
                      target="_blank"
                      style="color: #0284c7; background: #f0f9ff; border: 1px solid #bae6fd; padding: 4px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 3px;"
                    >
                      <span>Publik</span>
                      <Icon name="arrow-right" size={10} />
                    </a>
                  {/if}
                </div>
              {:else if isSuspended}
                <span style="background: #fee2e2; color: #b91c1c; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                  <Icon name="alert-triangle" size={12} />
                  Ditangguhkan (Materi Kedaluwarsa)
                </span>
              {:else}
                <button
                  disabled={evaluatingGateId === gate.id}
                  onclick={() => handleEvaluateGate(gate.id)}
                  style="background: #0f766e; color: #ffffff; border: none; padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer;"
                >
                  {evaluatingGateId === gate.id ? 'Mengevaluasi...' : 'Klaim / Evaluasi Gerbang'}
                </button>
              {/if}
            </div>
          </div>

          <p style="margin: 0; font-size: 0.85rem; color: #475569; line-height: 1.45;">
            {gate.description || meta.desc}
          </p>
        </div>
      {/each}
    </div>
  {/if}

  {#if showVcModal && issuedVc}
    <div
      class="modal-backdrop"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(4px);"
      onclick={() => (showVcModal = false)}
      onkeydown={(e) => e.key === 'Escape' && (showVcModal = false)}
    >
      <div
        style="background: #ffffff; width: 100%; max-width: 620px; max-height: 90vh; border-radius: 20px; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden;"
        tabindex="-1"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        <div style="padding: 18px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #0f766e; color: #ffffff;">
          <div>
            <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">
              W3C VC 2.0 · OpenBadges 3.0
            </span>
            <h3 style="margin: 2px 0 0; font-size: 1.15rem; font-weight: 800;">
              Kredensial Digital Terverifikasi Kriptografis
            </h3>
          </div>
          <button
            onclick={() => (showVcModal = false)}
            style="border: none; background: rgba(255,255,255,0.2); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #ffffff;"
          >
            <Icon name="xmark" size={16} />
          </button>
        </div>

        <div style="padding: 20px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 0.75rem; font-weight: 800; color: #166534; text-transform: uppercase;">
                DataIntegrityProof (Ed25519 · RDFC-1.0)
              </div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #0f172a;">
                {issuedVc.credentialSubject?.achievement?.gateTitle}
              </div>
            </div>
            <span style="background: #166534; color: #ffffff; font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 6px;">
              OFFLINE VERIFIABLE
            </span>
          </div>

          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 4px;">
              Dokumen Kredensial JSON Lengkap:
            </div>
            <pre style="background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 10px; font-size: 0.72rem; overflow-x: auto; max-height: 220px; font-family: monospace; margin: 0;">{JSON.stringify(issuedVc, null, 2)}</pre>
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #e2e8f0; padding-top: 14px;">
            <button
              onclick={copyVcJson}
              style="padding: 8px 16px; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; font-weight: 700; font-size: 0.85rem; color: #334155; cursor: pointer; display: flex; align-items: center; gap: 6px;"
            >
              <Icon name="clipboard" size={14} />
              <span>{copiedVcJson ? 'Tersalin!' : 'Salin JSON'}</span>
            </button>
            <button
              onclick={downloadVcJson}
              style="padding: 8px 16px; border-radius: 8px; border: none; background: #0f766e; font-weight: 700; font-size: 0.85rem; color: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 6px;"
            >
              <Icon name="download" size={14} />
              <span>Unduh Berkas .json</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
