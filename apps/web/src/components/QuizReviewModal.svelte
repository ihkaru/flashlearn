<script lang="ts">
  import { api } from '../stores/api';
  import type { Content, QuizQuestion, QuizSubmissionRecord } from '@flashlearn/shared';
  import Icon from './ui/Icon.svelte';
  import ExecutiveMetrics from './review/ExecutiveMetrics.svelte';
  import QuestionDiscussionCard from './review/QuestionDiscussionCard.svelte';
  import ParticipantsTab from './review/ParticipantsTab.svelte';

  interface Props {
    content: Content;
    isOpen: boolean;
    initialTab?: 'analysis' | 'participants';
    onClose: () => void;
  }

  let { content, isOpen, initialTab = 'analysis', onClose }: Props = $props();

  let activeTab = $state<'analysis' | 'participants'>('analysis');
  let submissions = $state<QuizSubmissionRecord[]>([]);
  let fullQuestions = $state<QuizQuestion[]>([]);
  let isLoading = $state(true);
  let isExporting = $state(false);
  let filterMode = $state<'all' | 'wrong_only' | 'mastered_only'>('all');
  let sortMode = $state<'most_wrong' | 'question_order' | 'most_correct'>('most_wrong');

  $effect(() => {
    if (isOpen) {
      activeTab = initialTab;
      loadData();
    }
  });

  async function loadData() {
    isLoading = true;
    try {
      submissions = await api.contents.getSubmissions(content.id);
      if (content.questions && content.questions.length > 0 && content.questions[0].options?.[0]?.isCorrect !== undefined) {
        fullQuestions = content.questions;
      } else {
        const fullContent = await api.contents.get(content.id);
        fullQuestions = fullContent.questions || [];
      }
    } catch (err: any) {
      console.error('Failed to load review data:', err);
    } finally {
      isLoading = false;
    }
  }

  async function handleExport(format: 'xlsx' | 'csv') {
    isExporting = true;
    try {
      await api.contents.downloadExport(content.id, format);
    } catch (err: any) {
      alert(`Gagal mengekspor data: ${err.message}`);
    } finally {
      isExporting = false;
    }
  }

  // --- Analytics Derivations ---
  const totalParticipants = $derived(submissions.length);

  const averageScore = $derived(
    totalParticipants > 0
      ? Math.round(submissions.reduce((acc, s) => acc + s.percentage, 0) / totalParticipants)
      : 0
  );

  const passingCount = $derived(submissions.filter((s) => s.percentage >= 70).length);

  const passingRate = $derived(
    totalParticipants > 0 ? Math.round((passingCount / totalParticipants) * 100) : 0
  );

  const questionsAnalysis = $derived(
    fullQuestions.map((q, idx) => {
      let answeredCount = 0;
      let correctCount = 0;
      const optionPicks: Record<string, number> = {};

      for (const sub of submissions) {
        const answers = sub.answers;
        if (answers && typeof answers === 'object') {
          const pickedOptionId = Array.isArray(answers)
            ? answers.find((a: any) => a.questionId === q.id)?.selectedOptionId
            : answers[q.id];

          if (pickedOptionId) {
            answeredCount++;
            optionPicks[pickedOptionId] = (optionPicks[pickedOptionId] || 0) + 1;
            const correctOpt = q.options.find((o) => o.isCorrect);
            if (correctOpt && correctOpt.id === pickedOptionId) {
              correctCount++;
            }
          }
        }
      }

      const totalAnswered = answeredCount > 0 ? answeredCount : totalParticipants;
      const wrongCount = totalAnswered - correctCount;
      const wrongRate = totalAnswered > 0 ? Math.round((wrongCount / totalAnswered) * 100) : 0;
      const correctRate = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

      let topDistractor: any = null;
      let maxDistractorPicks = 0;

      const optionsStats = (q.options || []).map((opt) => {
        const picks = optionPicks[opt.id] || 0;
        const pct = totalAnswered > 0 ? Math.round((picks / totalAnswered) * 100) : 0;
        if (!opt.isCorrect && picks > maxDistractorPicks) {
          maxDistractorPicks = picks;
          topDistractor = { id: opt.id, text: opt.text, pickCount: picks, percentage: pct };
        }
        return {
          id: opt.id,
          text: opt.text,
          isCorrect: !!opt.isCorrect,
          pickCount: picks,
          percentage: pct,
        };
      });

      return {
        index: idx + 1,
        question: q,
        totalAnswered,
        correctCount,
        wrongCount,
        wrongRate,
        correctRate,
        isNeedDiscussion: wrongRate > 0,
        isMastered: wrongCount === 0 && totalAnswered > 0,
        topDistractor,
        optionsStats,
      };
    })
  );

  const missedQuestionsCount = $derived(questionsAnalysis.filter((q) => q.isNeedDiscussion).length);
  const masteredQuestionsCount = $derived(questionsAnalysis.filter((q) => q.isMastered).length);

  const mostMissedQuestion = $derived(
    [...questionsAnalysis].sort((a, b) => b.wrongRate - a.wrongRate)[0] || null
  );

  const filteredQuestions = $derived(
    questionsAnalysis
      .filter((item) => {
        if (filterMode === 'wrong_only') return item.isNeedDiscussion;
        if (filterMode === 'mastered_only') return item.isMastered;
        return true;
      })
      .sort((a, b) => {
        if (sortMode === 'most_wrong') return b.wrongRate - a.wrongRate;
        if (sortMode === 'most_correct') return b.correctRate - a.correctRate;
        return a.index - b.index;
      })
  );
</script>

{#if isOpen}
  <div
    class="fl-modal-backdrop"
    style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); z-index: 10500; display: flex; align-items: center; justify-content: center; padding: 16px;"
    onclick={(e) => e.target === e.currentTarget && onClose()}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <div
      style="background: #ffffff; width: 100%; max-width: 920px; max-height: 94vh; border-radius: 20px; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.28); overflow: hidden; border: 1px solid #e2e8f0;"
      onclick={(e) => e.stopPropagation()}
      role="document"
      tabindex="0"
    >
      <!-- Modal Header -->
      <div
        style="padding: 16px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; flex-shrink: 0;"
      >
        <div style="display: flex; align-items: center; gap: 12px;">
          <div
            style="width: 42px; height: 42px; border-radius: 12px; background: #f0fdfa; border: 1px solid #ccfbf1; display: flex; align-items: center; justify-content: center; color: #0f766e;"
          >
            <Icon name="sparkles" size={22} />
          </div>
          <div>
            <h2 style="margin: 0; font-size: 1.25rem; color: #0f172a; font-weight: 800; line-height: 1.2;">
              Pembahasan & Rekap: {content.title}
            </h2>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">
              Analisis butir soal, miskonsepsi peserta, dan rekap evaluasi pembelajaran.
            </div>
          </div>
        </div>

        <button
          type="button"
          onclick={onClose}
          style="background: #ffffff; border: 1px solid #cbd5e1; color: #64748b; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;"
          aria-label="Tutup"
        >
          <Icon name="xmark" size={16} />
        </button>
      </div>

      <!-- Segmented Navigation Tabs -->
      <div
        style="display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; padding: 6px 20px; gap: 8px; flex-shrink: 0;"
      >
        <button
          type="button"
          onclick={() => (activeTab = 'analysis')}
          style="flex: 1; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; background: {activeTab ===
          'analysis'
            ? '#0f766e'
            : 'transparent'}; color: {activeTab === 'analysis' ? '#ffffff' : '#64748b'};"
        >
          <Icon name="sparkles" size={15} />
          <span>Bahas Butir Soal ({fullQuestions.length})</span>
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'participants')}
          style="flex: 1; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; background: {activeTab ===
          'participants'
            ? '#0f766e'
            : 'transparent'}; color: {activeTab === 'participants' ? '#ffffff' : '#64748b'};"
        >
          <Icon name="users" size={15} />
          <span>Daftar Peserta & Nilai ({totalParticipants})</span>
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div style="flex: 1; overflow-y: auto; padding: 22px; -webkit-overflow-scrolling: touch;">
        {#if isLoading}
          <div style="text-align: center; padding: 48px; color: #64748b;">
            <Icon name="arrow-path" size={24} class="animate-spin" />
            <div style="margin-top: 8px; font-weight: 600;">Memuat analisis evaluasi kuis...</div>
          </div>
        {:else if activeTab === 'analysis'}
          <!-- Executive Metrics Component -->
          <ExecutiveMetrics
            {averageScore}
            {passingRate}
            {passingCount}
            {totalParticipants}
            {missedQuestionsCount}
            totalQuestions={fullQuestions.length}
            {mostMissedQuestion}
          />

          <!-- Discussion Controls Toolbar -->
          <div
            style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;"
          >
            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-right: 4px;">
                Tampilkan:
              </span>
              <button
                type="button"
                class="fl-btn fl-btn-sm fl-pill-btn"
                onclick={() => (filterMode = 'all')}
                style="font-size: 0.775rem; font-weight: 600; border: 1px solid {filterMode === 'all' ? '#0f766e' : '#cbd5e1'}; background: {filterMode === 'all' ? '#f0fdfa' : '#ffffff'}; color: {filterMode === 'all' ? '#0f766e' : '#64748b'};"
              >
                Semua Soal ({questionsAnalysis.length})
              </button>
              <button
                type="button"
                class="fl-btn fl-btn-sm fl-pill-btn"
                onclick={() => (filterMode = 'wrong_only')}
                style="font-size: 0.775rem; font-weight: 700; border: 1px solid {filterMode === 'wrong_only' ? '#dc2626' : '#cbd5e1'}; background: {filterMode === 'wrong_only' ? '#fee2e2' : '#ffffff'}; color: {filterMode === 'wrong_only' ? '#dc2626' : '#64748b'};"
              >
                Perlu Dibahas ({missedQuestionsCount})
              </button>
              <button
                type="button"
                class="fl-btn fl-btn-sm fl-pill-btn"
                onclick={() => (filterMode = 'mastered_only')}
                style="font-size: 0.775rem; font-weight: 600; border: 1px solid {filterMode === 'mastered_only' ? '#16a34a' : '#cbd5e1'}; background: {filterMode === 'mastered_only' ? '#dcfce7' : '#ffffff'}; color: {filterMode === 'mastered_only' ? '#16a34a' : '#64748b'};"
              >
                Dikuasai 100% ({masteredQuestionsCount})
              </button>
            </div>

            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #334155;">Urutan:</span>
              <select
                bind:value={sortMode}
                style="padding: 5px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.775rem; font-weight: 600; color: #334155; background: #ffffff; outline: none; cursor: pointer;"
              >
                <option value="most_wrong">Paling Banyak Salah (Tersulit)</option>
                <option value="question_order">Nomor Soal (1, 2, 3...)</option>
                <option value="most_correct">Paling Banyak Benar (Termudah)</option>
              </select>
            </div>
          </div>

          <!-- Question Cards for Discussion -->
          <div style="display: flex; flex-direction: column; gap: 18px;">
            {#if filteredQuestions.length === 0}
              <div
                style="text-align: center; padding: 40px 16px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; color: #64748b;"
              >
                Tidak ada soal yang sesuai dengan filter yang dipilih.
              </div>
            {/if}

            {#each filteredQuestions as item (item.index)}
              <QuestionDiscussionCard {item} />
            {/each}
          </div>
        {:else}
          <!-- Participants Tab Component -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 12px; gap: 8px;">
            <button
              type="button"
              onclick={() => handleExport('xlsx')}
              disabled={isExporting || totalParticipants === 0}
              style="background: #15803d; color: #ffffff; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 6px;"
            >
              <Icon name="arrow-down-tray" size={13} />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onclick={() => handleExport('csv')}
              disabled={isExporting || totalParticipants === 0}
              style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 6px;"
            >
              <span>Ekspor CSV</span>
            </button>
          </div>
          <ParticipantsTab {submissions} />
        {/if}
      </div>

      <!-- Modal Footer -->
      <div
        style="padding: 14px 24px; border-top: 1px solid #e2e8f0; background: #ffffff; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-shrink: 0;"
      >
        <span style="font-size: 0.8rem; color: #64748b;">
          💡 Tip: Gunakan mode ini di layar proyektor untuk membahas butir soal yang paling membingungkan bersama peserta.
        </span>
        <button
          type="button"
          class="fl-pill-btn"
          onclick={onClose}
          style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 7px 16px; border-radius: 8px; font-weight: 700; font-size: 0.825rem; cursor: pointer;"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}
