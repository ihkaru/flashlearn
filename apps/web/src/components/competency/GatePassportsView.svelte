<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '../../stores/api';
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
                <span style="background: #dcfce7; color: #15803d; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                  <Icon name="check" size={12} />
                  Paspor Aktif
                </span>
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
</div>
