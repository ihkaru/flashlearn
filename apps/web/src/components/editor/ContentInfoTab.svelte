<script lang="ts">
  import type { ContentType } from '@flashlearn/shared';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    title: string;
    type: ContentType;
    summary: string;
    readingTimeMinutes: number;
    isPublished: boolean;
    body: string;
  }

  let {
    title = $bindable(),
    type = $bindable(),
    summary = $bindable(),
    readingTimeMinutes = $bindable(),
    isPublished = $bindable(),
    body = $bindable(),
  }: Props = $props();
</script>

<div style="display: flex; flex-direction: column; gap: 16px;">
  <!-- Content Type Selector -->
  <div>
    <label for="fl-content-type" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 8px;">
      Tipe Modul Pembelajaran
    </label>
    <div id="fl-content-type" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
      <button
        type="button"
        onclick={() => (type = 'quiz')}
        style="text-align: left; padding: 12px; border-radius: 10px; border: 2px solid {type === 'quiz' ? '#0f766e' : '#e2e8f0'}; background: {type === 'quiz' ? '#f0fdfa' : '#ffffff'}; cursor: pointer; min-height: 84px; display: flex; flex-direction: column; justify-content: flex-start; text-wrap: balance;"
      >
        <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 0.9rem; color: #0f172a; margin-bottom: 2px;">
          <Icon name="check-circle" size={15} style="color: #0f766e;" />
          <span>Kuis Saja</span>
        </div>
        <div style="font-size: 0.775rem; color: #64748b; line-height: 1.3;">
          Asesmen interaktif, skor otomatis & 3D flashcards.
        </div>
      </button>

      <button
        type="button"
        onclick={() => (type = 'materi')}
        style="text-align: left; padding: 12px; border-radius: 10px; border: 2px solid {type === 'materi' ? '#0f766e' : '#e2e8f0'}; background: {type === 'materi' ? '#f0fdfa' : '#ffffff'}; cursor: pointer; min-height: 84px; display: flex; flex-direction: column; justify-content: flex-start; text-wrap: balance;"
      >
        <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 0.9rem; color: #0f172a; margin-bottom: 2px;">
          <Icon name="book-open" size={15} style="color: #1d4ed8;" />
          <span>Materi Saja</span>
        </div>
        <div style="font-size: 0.775rem; color: #64748b; line-height: 1.3;">
          Bahan bacaan artikel / teori dengan format Markdown.
        </div>
      </button>

      <button
        type="button"
        onclick={() => (type = 'combined')}
        style="text-align: left; padding: 12px; border-radius: 10px; border: 2px solid {type === 'combined' ? '#0f766e' : '#e2e8f0'}; background: {type === 'combined' ? '#f0fdfa' : '#ffffff'}; cursor: pointer; min-height: 84px; display: flex; flex-direction: column; justify-content: flex-start; text-wrap: balance;"
      >
        <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 0.9rem; color: #0f172a; margin-bottom: 2px;">
          <Icon name="layers" size={15} style="color: #0f766e;" />
          <span>Materi + Kuis</span>
        </div>
        <div style="font-size: 0.775rem; color: #64748b; line-height: 1.3;">
          Bahan teori di awal dilanjutkan evaluasi pemahaman.
        </div>
      </button>
    </div>
  </div>

  <!-- Title -->
  <div>
    <label for="fl-title-input" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
      Judul Modul <span style="color: #ef4444;">*</span>
    </label>
    <input
      id="fl-title-input"
      type="text"
      placeholder="Contoh: Validasi Topologi Peta Wilkerstat SE2026..."
      bind:value={title}
      style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.925rem; box-sizing: border-box; outline: none;"
    />
  </div>

  <!-- Summary -->
  <div>
    <label for="fl-summary-input" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
      Ringkasan / Deskripsi Singkat
    </label>
    <input
      id="fl-summary-input"
      type="text"
      placeholder="Rangkuman 1-2 kalimat untuk preview modul..."
      bind:value={summary}
      style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.925rem; box-sizing: border-box; outline: none;"
    />
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
    <!-- Reading / Quiz time -->
    <div>
      <label for="fl-time-input" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
        Estimasi Waktu (Menit)
      </label>
      <input
        id="fl-time-input"
        type="number"
        min="1"
        max="120"
        bind:value={readingTimeMinutes}
        style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.925rem; box-sizing: border-box; outline: none;"
      />
    </div>

    <!-- Publication Status -->
    <div>
      <label for="fl-status-select" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
        Status Publikasi
      </label>
      <select
        id="fl-status-select"
        bind:value={isPublished}
        style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.925rem; box-sizing: border-box; background: #ffffff;"
      >
        <option value={true}>Terbitkan Sekarang (Aktif)</option>
        <option value={false}>Draf (Belum Terbit)</option>
      </select>
    </div>
  </div>

  <!-- Material Body Markdown for Non-Quiz Types -->
  {#if type !== 'quiz'}
    <div>
      <label for="fl-body-input" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
        Isi Materi Teori (Markdown)
      </label>
      <textarea
        id="fl-body-input"
        rows="7"
        placeholder="# Judul Topik Teori&#10;&#10;Jelaskan materi pembelajaran di sini menggunakan format Markdown..."
        bind:value={body}
        style="width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-family: monospace; box-sizing: border-box; line-height: 1.5;"
      ></textarea>
    </div>
  {/if}
</div>
