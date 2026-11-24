<script lang="ts">
  import type { Content } from '@flashlearn/shared';
  import {
    extractDistinctTopics,
    selectDrillQuestions,
    type DrillQuestion,
    type MasteryFilter,
    type QuizMasteryMap,
  } from '../../lib/quizMasteryStore';

  interface ConfigPatch {
    sessionSize?: number | 'all';
    selectedTopic?: string;
    masteryFilter?: MasteryFilter;
    shuffle?: boolean;
    guestName?: string;
  }

  interface Props {
    content: Content;
    questions: DrillQuestion[];
    masteryMap: QuizMasteryMap;
    sessionSize: number | 'all';
    selectedTopic: string;
    masteryFilter: MasteryFilter;
    shuffle: boolean;
    guestName: string;
    isLoggedIn: boolean;
    isLoadingFlashcards?: boolean;
    onUpdateConfig: (patch: ConfigPatch) => void;
    onStartPractice: () => void;
    onStartFlashcards: () => void;
    onStartExam: () => void;
  }

  let {
    content, questions, masteryMap, sessionSize, selectedTopic, masteryFilter, shuffle,
    guestName, isLoggedIn, isLoadingFlashcards = false,
    onUpdateConfig, onStartPractice, onStartFlashcards, onStartExam,
  }: Props = $props();

  let showExamNamePrompt = $state(false);
  let nameError = $state<string | null>(null);

  let topics = $derived(extractDistinctTopics(questions));
  let masteredCount = $derived(
    questions.reduce((acc, q) => acc + (masteryMap[q.id]?.status === 'mastered' ? 1 : 0), 0)
  );
  let masteryRatio = $derived(questions.length > 0 ? masteredCount / questions.length : 0);
  let matchingCount = $derived(
    selectDrillQuestions(questions, { size: 'all', topic: selectedTopic, masteryFilter, shuffle: false, masteryMap }).length
  );
  let sizeOptions = $derived<Array<number | 'all'>>([
    ...[10, 20, 30, 50].filter((n) => n < questions.length),
    'all',
  ]);
  let effectiveCount = $derived(sessionSize === 'all' ? matchingCount : Math.min(sessionSize, matchingCount));

  function handleExamClick() {
    if (isLoggedIn || guestName.trim().length >= 2) {
      nameError = null;
      onStartExam();
    } else {
      showExamNamePrompt = true;
    }
  }

  function submitExamWithName() {
    if (guestName.trim().length < 2) {
      nameError = 'Masukkan nama minimal 2 karakter untuk mencatat skor ujian.';
      return;
    }
    nameError = null;
    onStartExam();
  }
</script>

<div class="fl-step-enter" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: clamp(20px, 3.5vw, 28px);">
  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
    <span style="background: #f0fdfa; color: var(--ws-accent, #0f766e); border: 1px solid #99f6e4; font-size: 0.76rem; font-weight: 700; padding: 3px 10px; border-radius: 6px;">
      {questions.length} Soal &amp; Flashcard
    </span>
    <span style="font-size: 0.8rem; font-weight: 600; color: #475569;">
      Dikuasai: <strong style="color: #0f172a;">{masteredCount}/{questions.length}</strong>
    </span>
  </div>

  <h1 style="margin: 0 0 6px 0; font-size: clamp(1.3rem, 3vw, 1.55rem); font-weight: 800; color: #0f172a; line-height: 1.3;">{content.title}</h1>
  {#if content.summary}
    <p style="margin: 0 0 14px 0; font-size: 0.92rem; color: #475569; line-height: 1.5;">{content.summary}</p>
  {/if}

  <div style="height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: 18px;">
    <div class="fl-progress-bar-fill" style="background: var(--ws-accent, #0f766e); transform: scaleX({masteryRatio});"></div>
  </div>

  <div style="display: flex; flex-direction: column; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 15px; margin-bottom: 18px;">
    <div>
      <div style="font-size: 0.76rem; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 6px;">Ukuran Sesi</div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        {#each sizeOptions as opt}
          {@const active = sessionSize === opt}
          <button type="button" onclick={() => onUpdateConfig({ sessionSize: opt })} style="min-height: 36px; padding: 6px 12px; border-radius: 8px; font-size: 0.84rem; font-weight: 700; cursor: pointer; border: 1.5px solid {active ? 'var(--ws-accent, #0f766e)' : '#cbd5e1'}; background: {active ? 'var(--ws-accent, #0f766e)' : '#ffffff'}; color: {active ? '#ffffff' : '#334155'};">
            {opt === 'all' ? `Semua (${matchingCount})` : `${opt} Soal`}
          </button>
        {/each}
      </div>
    </div>

    {#if topics.length > 0}
      <div>
        <div style="font-size: 0.76rem; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 6px;">Filter Topik</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          {#each ['all', ...topics] as t}
            {@const active = selectedTopic === t}
            <button type="button" onclick={() => onUpdateConfig({ selectedTopic: t })} style="min-height: 34px; padding: 5px 11px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: 1px solid {active ? 'var(--ws-accent, #0f766e)' : '#cbd5e1'}; background: {active ? 'var(--ws-accent, #0f766e)' : '#ffffff'}; color: {active ? '#ffffff' : '#334155'};">
              {t === 'all' ? 'Semua Topik' : t}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        {#each [{ id: 'all', label: 'Semua' }, { id: 'unmastered', label: 'Belum Dikuasai' }, { id: 'review', label: 'Perlu Diulang' }] as f}
          {@const active = masteryFilter === f.id}
          <button type="button" onclick={() => onUpdateConfig({ masteryFilter: f.id as MasteryFilter })} style="min-height: 34px; padding: 5px 10px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: 1px solid {active ? '#0f172a' : '#cbd5e1'}; background: {active ? '#0f172a' : '#ffffff'}; color: {active ? '#ffffff' : '#334155'};">
            {f.label}
          </button>
        {/each}
      </div>

      <label style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.84rem; font-weight: 600; color: #1e293b; cursor: pointer;">
        <input type="checkbox" checked={shuffle} onchange={(e) => onUpdateConfig({ shuffle: (e.currentTarget as HTMLInputElement).checked })} style="width: 17px; height: 17px; accent-color: var(--ws-accent, #0f766e);" />
        Acak Urutan (Interleaving)
      </label>
    </div>

    <div style="font-size: 0.8rem; color: #475569;">
      Sesi siap: <strong style="color: #0f172a;">{effectiveCount} soal</strong>
      {#if matchingCount === 0}
        <span style="color: #b91c1c; font-weight: 600;"> — Tidak ada soal yang cocok dengan filter ini.</span>
      {/if}
    </div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
    <button type="button" disabled={effectiveCount === 0} onclick={onStartPractice} class="fl-btn fl-btn-lg" style="background: var(--ws-accent, #0f766e); color: #ffffff; border: none; font-weight: 700; width: 100%; justify-content: space-between; text-align: left; padding: 14px 18px; opacity: {effectiveCount === 0 ? 0.5 : 1};">
      <span>Latihan Aktif (1 per layar)</span>
      <span style="font-size: 0.78rem; font-weight: 600; opacity: 0.9;">Direkomendasikan</span>
    </button>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px;">
      <button type="button" disabled={effectiveCount === 0 || isLoadingFlashcards} onclick={onStartFlashcards} class="fl-btn fl-btn-md" style="background: #ffffff; color: #0f172a; border: 1.5px solid #cbd5e1; font-weight: 700; width: 100%; opacity: {effectiveCount === 0 ? 0.5 : 1};">
        {isLoadingFlashcards ? 'Memuat Flashcard...' : 'Flashcard 3D (Active Recall)'}
      </button>
      <button type="button" disabled={effectiveCount === 0} onclick={handleExamClick} class="fl-btn fl-btn-md" style="background: #f8fafc; color: #1e293b; border: 1.5px solid #cbd5e1; font-weight: 700; width: 100%; opacity: {effectiveCount === 0 ? 0.5 : 1};">
        Mode Ujian (Skor Resmi)
      </button>
    </div>
  </div>

  {#if showExamNamePrompt && !isLoggedIn}
    <div class="fl-step-enter" style="margin-top: 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px;">
      <label for="exam-guest-name" style="display: block; font-size: 0.85rem; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Nama Peserta untuk Skor Resmi</label>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <input id="exam-guest-name" type="text" value={guestName} placeholder="Ketik nama atau panggilanmu..." oninput={(e) => { nameError = null; onUpdateConfig({ guestName: (e.currentTarget as HTMLInputElement).value }); }} onkeydown={(e) => e.key === 'Enter' && submitExamWithName()} style="flex: 1; min-width: 180px; padding: 10px 12px; border: 1.5px solid {nameError ? '#dc2626' : '#cbd5e1'}; border-radius: 8px; font-size: 0.9rem; color: #0f172a; background: #ffffff;" />
        <button type="button" onclick={submitExamWithName} class="fl-btn fl-btn-md" style="background: var(--ws-accent, #0f766e); color: #ffffff; border: none; font-weight: 700;">Mulai Ujian</button>
      </div>
      {#if nameError}
        <p style="margin: 6px 0 0 0; font-size: 0.8rem; color: #b91c1c; font-weight: 600;">{nameError}</p>
      {/if}
    </div>
  {/if}
</div>
