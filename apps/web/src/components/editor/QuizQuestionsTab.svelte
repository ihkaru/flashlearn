<script lang="ts">
  import type { QuizQuestion } from '@flashlearn/shared';
  import Icon from '../ui/Icon.svelte';
  import QuestionItemEditor from './QuestionItemEditor.svelte';

  interface Props {
    questions: QuizQuestion[];
    onAddQuestion: () => void;
    onRemoveQuestion: (idx: number) => void;
    onMoveQuestion: (idx: number, dir: 'up' | 'down') => void;
    onAddOption: (qIdx: number) => void;
    onRemoveOption: (qIdx: number, optIdx: number) => void;
    onSetCorrectOption: (qIdx: number, optIdx: number) => void;
  }

  let {
    questions = $bindable(),
    onAddQuestion,
    onRemoveQuestion,
    onMoveQuestion,
    onAddOption,
    onRemoveOption,
    onSetCorrectOption,
  }: Props = $props();
</script>

<div style="display: flex; flex-direction: column; gap: 16px;">
  <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
    <div>
      <div style="font-weight: 800; font-size: 1rem; color: #0f172a;">
        Daftar Butir Soal Kuis
      </div>
      <div style="font-size: 0.8rem; color: #64748b;">
        Pilih kunci jawaban benar dengan menekan tombol centang pada opsi yang sesuai.
      </div>
    </div>

    <button
      type="button"
      onclick={onAddQuestion}
      style="background: #0f766e; color: #ffffff; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 0.825rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(15,118,110,0.25); white-space: nowrap;"
    >
      <Icon name="plus" size={14} />
      <span>Tambah Soal</span>
    </button>
  </div>

  {#each questions as q, qIdx (q.id)}
    <QuestionItemEditor
      bind:question={questions[qIdx]}
      {qIdx}
      totalQuestions={questions.length}
      onMoveUp={() => onMoveQuestion(qIdx, 'up')}
      onMoveDown={() => onMoveQuestion(qIdx, 'down')}
      onRemove={() => onRemoveQuestion(qIdx)}
      onAddOption={() => onAddOption(qIdx)}
      onRemoveOption={(optIdx) => onRemoveOption(qIdx, optIdx)}
      onSetCorrectOption={(optIdx) => onSetCorrectOption(qIdx, optIdx)}
    />
  {/each}

  <button
    type="button"
    onclick={onAddQuestion}
    style="width: 100%; border: 1.5px dashed #0f766e; background: #f0fdfa; color: #0f766e; padding: 12px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;"
  >
    <Icon name="plus" size={16} />
    <span>Tambah Butir Soal Baru</span>
  </button>
</div>
