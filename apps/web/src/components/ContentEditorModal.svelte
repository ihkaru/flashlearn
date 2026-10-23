<script lang="ts">
  import { api } from '../stores/api';
  import type { Content, ContentType, QuizQuestion } from '@flashlearn/shared';
  import Icon from './ui/Icon.svelte';
  import ContentInfoTab from './editor/ContentInfoTab.svelte';
  import QuizQuestionsTab from './editor/QuizQuestionsTab.svelte';
  import QuizPreviewTab from './editor/QuizPreviewTab.svelte';

  interface Props {
    isOpen: boolean;
    workspaceId: string;
    content?: Content | null;
    contentToEdit?: Content | null;
    onClose: () => void;
    onSaved: (content: Content) => void;
  }

  let {
    isOpen,
    workspaceId,
    content = null,
    contentToEdit = null,
    onClose,
    onSaved,
  }: Props = $props();

  const activeContent = $derived(content || contentToEdit);
  const isEditMode = $derived(!!activeContent);

  // Form Fields
  let title = $state('');
  let type = $state<ContentType>('quiz');
  let summary = $state('');
  let readingTimeMinutes = $state(5);
  let body = $state('');
  let isPublished = $state(true);
  let questions = $state<QuizQuestion[]>([]);

  // UI state
  let activeTab = $state<'info' | 'questions' | 'preview'>('info');
  let isSaving = $state(false);
  let validationError = $state<string | null>(null);

  // Synchronize form whenever modal opens or contentToEdit changes
  $effect(() => {
    if (isOpen) {
      validationError = null;
      if (activeContent) {
        title = activeContent.title;
        type = activeContent.type;
        summary = activeContent.summary || '';
        readingTimeMinutes = activeContent.readingTimeMinutes || 5;
        body = activeContent.body || '';
        isPublished = activeContent.isPublished ?? true;

        if (activeContent.questions && activeContent.questions.length > 0) {
          questions = JSON.parse(JSON.stringify(activeContent.questions));
        } else if (activeContent.type !== 'materi') {
          questions = [createBlankQuestion(1)];
        } else {
          questions = [];
        }
        activeTab = activeContent.type === 'materi' ? 'info' : 'questions';
      } else {
        title = '';
        type = 'quiz';
        summary = '';
        readingTimeMinutes = 5;
        body = '';
        isPublished = true;
        questions = [createBlankQuestion(1)];
        activeTab = 'info';
      }
    }
  });

  function createBlankQuestion(index: number): QuizQuestion {
    return {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      question: '',
      difficulty: 'medium',
      explanation: '',
      hint: '',
      options: [
        { id: `opt_1_${Date.now()}`, text: '', isCorrect: true },
        { id: `opt_2_${Date.now()}`, text: '', isCorrect: false },
        { id: `opt_3_${Date.now()}`, text: '', isCorrect: false },
        { id: `opt_4_${Date.now()}`, text: '', isCorrect: false },
      ],
    };
  }

  function addQuestion() {
    questions = [...questions, createBlankQuestion(questions.length + 1)];
    validationError = null;
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) {
      alert('Kuis harus memiliki minimal 1 butir soal.');
      return;
    }
    questions = questions.filter((_, i) => i !== index);
    validationError = null;
  }

  function moveQuestion(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const updated = [...questions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    questions = updated;
  }

  function addOption(qIdx: number) {
    if (questions[qIdx].options.length >= 6) return;
    questions[qIdx].options = [
      ...questions[qIdx].options,
      {
        id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        text: '',
        isCorrect: false,
      },
    ];
  }

  function removeOption(qIdx: number, optIdx: number) {
    if (questions[qIdx].options.length <= 2) {
      alert('Soal pilihan ganda harus memiliki minimal 2 opsi.');
      return;
    }
    const hadCorrect = questions[qIdx].options[optIdx].isCorrect;
    questions[qIdx].options = questions[qIdx].options.filter((_, i) => i !== optIdx);
    if (hadCorrect && questions[qIdx].options.length > 0) {
      questions[qIdx].options[0].isCorrect = true;
    }
  }

  function setCorrectOption(qIdx: number, optIdx: number) {
    questions[qIdx].options = questions[qIdx].options.map((opt, i) => ({
      ...opt,
      isCorrect: i === optIdx,
    }));
  }

  function validate(): boolean {
    if (!title.trim()) {
      validationError = 'Judul modul wajib diisi.';
      activeTab = 'info';
      return false;
    }

    if (type !== 'materi') {
      if (questions.length === 0) {
        validationError = 'Kuis harus memiliki minimal 1 butir soal.';
        activeTab = 'questions';
        return false;
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question.trim()) {
          validationError = `Pertanyaan pada Soal #${i + 1} tidak boleh kosong.`;
          activeTab = 'questions';
          return false;
        }

        const validOptions = q.options.filter((opt) => opt.text.trim().length > 0);
        if (validOptions.length < 2) {
          validationError = `Soal #${i + 1} harus memiliki minimal 2 pilihan jawaban yang tidak kosong.`;
          activeTab = 'questions';
          return false;
        }

        const hasCorrect = q.options.some((opt) => opt.isCorrect);
        if (!hasCorrect) {
          validationError = `Pilih salah satu kunci jawaban benar pada Soal #${i + 1}.`;
          activeTab = 'questions';
          return false;
        }
      }
    }

    validationError = null;
    return true;
  }

  async function handleSave() {
    if (!validate()) return;

    isSaving = true;
    try {
      const payload = {
        workspaceId,
        title: title.trim(),
        type,
        summary: summary.trim() || undefined,
        readingTimeMinutes: Number(readingTimeMinutes) || 5,
        body: type !== 'quiz' ? body : undefined,
        questions: type !== 'materi' ? questions : undefined,
        isPublished,
      };

      let result: Content;
      if (isEditMode && activeContent) {
        result = await api.contents.update(activeContent.id, payload);
      } else {
        result = await api.contents.create(payload);
      }

      onSaved(result);
      onClose();
    } catch (err: any) {
      validationError = err.message || 'Gagal menyimpan modul pembelajaran.';
    } finally {
      isSaving = false;
    }
  }
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
      style="background: #ffffff; width: 100%; max-width: 820px; max-height: 94vh; border-radius: 20px; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3); overflow: hidden;"
      onclick={(e) => e.stopPropagation()}
      role="document"
      tabindex="0"
    >
      <!-- Modal Header -->
      <div
        style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; flex-shrink: 0;"
      >
        <div style="display: flex; align-items: center; gap: 10px;">
          <div
            style="width: 38px; height: 38px; border-radius: 10px; background: #f0fdfa; border: 1px solid #ccfbf1; display: flex; align-items: center; justify-content: center; color: #0f766e;"
          >
            <Icon name={isEditMode ? 'pencil' : 'plus'} size={18} />
          </div>
          <div>
            <h2 style="margin: 0; font-size: 1.15rem; color: #0f172a; font-weight: 800; line-height: 1.2;">
              {isEditMode ? 'Edit Modul Pembelajaran' : 'Buat Modul Pembelajaran Baru'}
            </h2>
            <div style="font-size: 0.775rem; color: #64748b; margin-top: 2px;">
              Formulir penyusunan materi teori, kuis evaluasi, atau gabungan.
            </div>
          </div>
        </div>

        <button
          type="button"
          onclick={onClose}
          style="background: #ffffff; border: 1px solid #e2e8f0; color: #64748b; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;"
          aria-label="Tutup"
        >
          <Icon name="xmark" size={16} />
        </button>
      </div>

      <!-- Segmented Navigation Tabs -->
      <div
        style="display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; padding: 6px 16px; gap: 6px; flex-shrink: 0;"
      >
        <button
          type="button"
          onclick={() => (activeTab = 'info')}
          style="flex: 1; padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 0.825rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; min-width: 0; background: {activeTab === 'info' ? '#0f766e' : 'transparent'}; color: {activeTab === 'info' ? '#ffffff' : '#64748b'};"
        >
          <Icon name="info-circle" size={14} />
          <span>Info Modul</span>
        </button>

        {#if type !== 'materi'}
          <button
            type="button"
            onclick={() => (activeTab = 'questions')}
            style="flex: 1; padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 0.825rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; min-width: 0; background: {activeTab === 'questions' ? '#0f766e' : 'transparent'}; color: {activeTab === 'questions' ? '#ffffff' : '#64748b'};"
          >
            <Icon name="check-circle" size={14} />
            <span>Butir Soal ({questions.length})</span>
          </button>

          <button
            type="button"
            onclick={() => (activeTab = 'preview')}
            style="flex: 1; padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 0.825rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; min-width: 0; background: {activeTab === 'preview' ? '#0f766e' : 'transparent'}; color: {activeTab === 'preview' ? '#ffffff' : '#64748b'};"
          >
            <Icon name="eye" size={14} />
            <span>Pratinjau</span>
          </button>
        {/if}
      </div>

      <!-- Error / Validation Alert Banner -->
      {#if validationError}
        <div
          style="background: #fef2f2; border-bottom: 1px solid #fecaca; color: #b91c1c; padding: 10px 16px; font-size: 0.825rem; font-weight: 600; display: flex; align-items: center; gap: 8px; flex-shrink: 0;"
        >
          <Icon name="exclamation-circle" size={16} />
          <span>{validationError}</span>
        </div>
      {/if}

      <!-- Modal Body (Scrollable) -->
      <div style="flex: 1; overflow-y: auto; padding: 18px; -webkit-overflow-scrolling: touch;">
        {#if activeTab === 'info'}
          <ContentInfoTab
            bind:title
            bind:type
            bind:summary
            bind:readingTimeMinutes
            bind:isPublished
            bind:body
          />
        {/if}

        {#if activeTab === 'questions'}
          <QuizQuestionsTab
            bind:questions
            onAddQuestion={addQuestion}
            onRemoveQuestion={removeQuestion}
            onMoveQuestion={moveQuestion}
            onAddOption={addOption}
            onRemoveOption={removeOption}
            onSetCorrectOption={setCorrectOption}
          />
        {/if}

        {#if activeTab === 'preview'}
          <QuizPreviewTab
            {title}
            {summary}
            {type}
            {readingTimeMinutes}
            {questions}
          />
        {/if}
      </div>

      <!-- Modal Footer -->
      <div
        style="padding: 12px 18px; border-top: 1px solid #e2e8f0; background: #ffffff; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; gap: 10px;"
      >
        <div style="font-size: 0.825rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          {#if type !== 'materi'}
            <strong>{questions.length} Soal</strong> terkonfigurasi
          {/if}
        </div>

        <div style="display: flex; gap: 8px; flex-shrink: 0;">
          <button
            type="button"
            disabled={isSaving}
            onclick={onClose}
            style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; white-space: nowrap;"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isSaving}
            onclick={handleSave}
            style="background: #0f766e; color: #ffffff; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25); white-space: nowrap;"
          >
            {#if isSaving}
              <Icon name="arrow-path" size={14} class="animate-spin" />
              <span>Menyimpan...</span>
            {:else}
              <Icon name="check" size={14} />
              <span>{isEditMode ? 'Simpan Perubahan' : 'Buat Modul'}</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
