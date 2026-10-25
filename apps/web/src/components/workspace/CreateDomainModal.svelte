<script lang="ts">
  import type { CreateDomainRequest } from '@flashlearn/shared';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    workspaceId: string;
    onClose: () => void;
    onCreated: () => void;
  }

  let { workspaceId, onClose, onCreated }: Props = $props();

  let code = $state('');
  let name = $state('');
  let targetRole = $state('');
  let responsibilityScope = $state('');
  let legalAuthorityLevel = $state<number>(1);
  let minPassingScore = $state<number>(85);
  let icon = $state('🎯');
  let description = $state('');
  let isSubmitting = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!code || !name || !targetRole || !responsibilityScope) {
      alert('Harap lengkapi kode domain, nama domain, target peran, dan lingkup tanggung jawab.');
      return;
    }
    isSubmitting = true;
    try {
      const payload: CreateDomainRequest = {
        workspaceId,
        code,
        name,
        targetRole,
        responsibilityScope,
        legalAuthorityLevel,
        minPassingScore,
        icon,
        description,
      };
      const res = await fetch(`/api/v1/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal membuat domain');
      }
      onCreated();
      onClose();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div
  role="dialog"
  aria-modal="true"
  style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px;"
  onclick={onClose}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
>
  <div
    style="background: #ffffff; width: 100%; max-width: 580px; border-radius: 18px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); max-height: 90vh; overflow-y: auto;"
    onclick={(e) => e.stopPropagation()}
    tabindex="-1"
  >
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h2 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;">
        <Icon name="shield-check" size={18} />
        Tambah Domain Kualifikasi Wewenang SDM
      </h2>
      <button onclick={onClose} class="fl-btn fl-btn-sm" style="background: transparent; border: none; font-size: 1.1rem; color: #64748b;">
        ✕
      </button>
    </div>

    <form onsubmit={handleSubmit} style="display: flex; flex-direction: column; gap: 14px;">
      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px;">
        <div>
          <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 4px;">Kode Domain</label>
          <input bind:value={code} placeholder="PROC-PP-01" required style="width: 100%; padding: 8px 10px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem;" />
        </div>
        <div>
          <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 4px;">Nama Domain</label>
          <input bind:value={name} placeholder="Sertifikasi Pejabat Pengadaan" required style="width: 100%; padding: 8px 10px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem;" />
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px;">
        <div>
          <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 4px;">Target Peran SDM</label>
          <input bind:value={targetRole} placeholder="Pejabat Pengadaan (PP)" required style="width: 100%; padding: 8px 10px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem;" />
        </div>
        <div>
          <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 4px;">Tingkat Otoritas</label>
          <select bind:value={legalAuthorityLevel} style="width: 100%; padding: 8px 10px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem;">
            <option value={1}>Tingkat 1 (Pelaksana/Staf)</option>
            <option value={2}>Tingkat 2 (Pejabat Teknis)</option>
            <option value={3}>Tingkat 3 (PPK / Pimpinan)</option>
          </select>
        </div>
      </div>

      <div>
        <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 4px;">
          Lingkup Tanggung Jawab Sah (Kewenangan yang Diberikan jika Lulus)
        </label>
        <textarea
          bind:value={responsibilityScope}
          placeholder="Jelaskan secara konkret wewenang dan tanggung jawab hukum/operasional yang sah diemban SDM setelah lulus..."
          rows="3"
          required
          style="width: 100%; padding: 8px 10px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem;"
        ></textarea>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
        <button type="button" onclick={onClose} class="fl-btn fl-btn-md" style="background: #f1f5f9; color: #475569; border: none;">
          Batal
        </button>
        <button type="submit" disabled={isSubmitting} class="fl-btn fl-btn-md" style="background: #0f766e; color: #ffffff; border: none; font-weight: 700;">
          {isSubmitting ? 'Menyimpan...' : 'Simpan Domain'}
        </button>
      </div>
    </form>
  </div>
</div>
