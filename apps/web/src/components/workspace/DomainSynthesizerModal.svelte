<script lang="ts">
  import { api } from '../../stores/api';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSynthesized: (workspaceId: string) => void;
  }

  let { isOpen, onClose, onSynthesized }: Props = $props();

  let workspaceName = $state('');
  let slug = $state('');
  let markdownContent = $state('');
  let isSynthesizing = $state(false);

  function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!workspaceName) {
      workspaceName = file.name.replace(/\.md$/i, '').replace(/[-_]+/g, ' ');
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      markdownContent = (event.target?.result as string) || '';
    };
    reader.readAsText(file);
  }

  async function handleSynthesize() {
    if (!workspaceName.trim()) {
      alert('Nama domain / workspace wajib diisi.');
      return;
    }
    if (!markdownContent.trim() || markdownContent.trim().length < 20) {
      alert('Isi dokumen regulasi / SOP dalam format Markdown minimal 20 karakter.');
      return;
    }

    isSynthesizing = true;
    try {
      const res = await api.workspaces.synthesizeMarkdown({
        workspaceName: workspaceName.trim(),
        markdownContent: markdownContent.trim(),
        slug: slug.trim() || undefined,
      });

      alert(`Domain '${workspaceName}' berhasil disintesis secara otonom!\nTotal Sumber: ${res.statistics?.sourcesCount || 1}\nKompetensi DAG: ${res.statistics?.competenciesCount || 3}\nGerbang Otorisasi: ${res.statistics?.gatesCount || 3}`);
      onClose();
      onSynthesized(res.workspaceId);
    } catch (err: any) {
      alert(`Gagal sintesis domain: ${err.message}`);
    } finally {
      isSynthesizing = false;
    }
  }
</script>

{#if isOpen}
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(4px);"
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <div
      style="background: #ffffff; width: 100%; max-width: 660px; max-height: 90vh; border-radius: 20px; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden;"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div style="padding: 18px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #0f766e; color: #ffffff;">
        <div>
          <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">
            Autonomous Curriculum Builder · Tarjan SCC
          </span>
          <h3 style="margin: 2px 0 0; font-size: 1.15rem; font-weight: 800;">
            Sintesis Domain dari Regulasi / SOP Markdown
          </h3>
        </div>
        <button
          onclick={onClose}
          style="border: none; background: rgba(255,255,255,0.2); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #ffffff;"
        >
          <Icon name="xmark" size={16} />
        </button>
      </div>

      <!-- Body Form -->
      <div style="padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label for="synth-ws-name" style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 4px;">
            Nama Domain / Standar Kompetensi:
          </label>
          <input
            id="synth-ws-name"
            type="text"
            placeholder="Contoh: SOP Manajemen Risiko Fasilitas Kritis"
            bind:value={workspaceName}
            style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem;"
          />
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <label for="synth-md-content" style="font-size: 0.82rem; font-weight: 700; color: #334155;">
              Naskah Regulasi / SOP (Format Markdown):
            </label>
            <label style="background: #f1f5f9; color: #0f766e; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
              <Icon name="upload" size={12} />
              <span>Unggah File .md</span>
              <input type="file" accept=".md,text/markdown" onchange={handleFileUpload} style="display: none;" />
            </label>
          </div>
          <textarea
            id="synth-md-content"
            rows="8"
            placeholder="# BAB I: Ketentuan Umum&#10;Pasal 1: Definisi & Kepatuhan...&#10;&#10;Tempelkan naskah SOP atau regulasi markdown Anda di sini..."
            bind:value={markdownContent}
            style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 0.78rem; line-height: 1.45;"
          ></textarea>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px; font-size: 0.8rem; color: #166534; line-height: 1.4;">
          <strong>Algoritma Sintesis Otonom:</strong> Memecah naskah menjadi chunk SHA-256 addressable, membangun graf prasyarat 3 tingkat Bloom (Kelas A, B, dan Adversarial Dilemma), memverifikasi asiklisitas DAG (Tarjan SCC), dan menginisialisasi 3 tingkat Gerbang Otorisasi secara otomatis.
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
          <button
            onclick={onClose}
            style="padding: 10px 18px; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; font-weight: 700; font-size: 0.88rem; color: #475569; cursor: pointer;"
          >
            Batal
          </button>
          <button
            disabled={isSynthesizing}
            onclick={handleSynthesize}
            style="padding: 10px 20px; border-radius: 8px; border: none; background: #0f766e; font-weight: 700; font-size: 0.88rem; color: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 6px;"
          >
            <Icon name="bolt" size={14} />
            <span>{isSynthesizing ? 'Menyintesis Domain...' : 'Sintesis Domain Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
