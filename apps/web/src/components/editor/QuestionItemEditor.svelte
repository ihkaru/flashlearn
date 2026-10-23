<script lang="ts">
  import type { QuizQuestion } from '@flashlearn/shared';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    question: QuizQuestion;
    qIdx: number;
    totalQuestions: number;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onRemove: () => void;
    onAddOption: () => void;
    onRemoveOption: (optIdx: number) => void;
    onSetCorrectOption: (optIdx: number) => void;
  }

  let {
    question = $bindable(),
    qIdx,
    totalQuestions,
    onMoveUp,
    onMoveDown,
    onRemove,
    onAddOption,
    onRemoveOption,
    onSetCorrectOption,
  }: Props = $props();

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
</script>

<div
  style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.02);"
>
  <!-- Question Card Top Header -->
  <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span
        style="background: #0f766e; color: #ffffff; font-weight: 800; font-size: 0.775rem; padding: 2px 8px; border-radius: 6px;"
      >
        Soal #{qIdx + 1}
      </span>

      <!-- Difficulty selector -->
      <select
        bind:value={question.difficulty}
        style="font-size: 0.75rem; font-weight: 700; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px 6px; background: #f8fafc; color: #475569;"
      >
        <option value="easy">Mudah</option>
        <option value="medium">Sedang</option>
        <option value="hard">Sulit</option>
      </select>
    </div>

    <div style="display: flex; gap: 4px; align-items: center;">
      <button
        type="button"
        disabled={qIdx === 0}
        onclick={onMoveUp}
        title="Pindahkan ke atas"
        aria-label="Pindahkan ke atas"
        style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; opacity: {qIdx === 0 ? '0.35' : '1'};"
      >
        <Icon name="arrow-up" size={12} />
      </button>
      <button
        type="button"
        disabled={qIdx === totalQuestions - 1}
        onclick={onMoveDown}
        title="Pindahkan ke bawah"
        aria-label="Pindahkan ke bawah"
        style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; opacity: {qIdx === totalQuestions - 1 ? '0.35' : '1'};"
      >
        <Icon name="arrow-down" size={12} />
      </button>
      <button
        type="button"
        onclick={onRemove}
        title="Hapus soal ini"
        aria-label="Hapus soal ini"
        style="background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; border-radius: 6px; padding: 4px 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;"
      >
        <Icon name="trash" size={13} />
        <span>Hapus</span>
      </button>
    </div>
  </div>

  <!-- Question Text -->
  <div>
    <textarea
      rows="2"
      placeholder="Tuliskan pertanyaan soal #{qIdx + 1}..."
      bind:value={question.question}
      style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-family: inherit; box-sizing: border-box; outline: none; line-height: 1.4;"
    ></textarea>
  </div>

  <!-- Multiple-choice Options Builder -->
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-weight: 700; font-size: 0.825rem; color: #334155;">
        Pilihan Jawaban (Tandai kunci yang benar):
      </span>
      {#if question.options.length < 6}
        <button
          type="button"
          onclick={onAddOption}
          style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #0f766e; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 4px;"
        >
          <Icon name="plus" size={12} />
          <span>Tambah Opsi</span>
        </button>
      {/if}
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px;">
      {#each question.options as opt, optIdx}
        <div
          style="display: flex; align-items: center; gap: 8px; background: {opt.isCorrect ? '#f0fdf4' : '#f8fafc'}; border: 1.5px solid {opt.isCorrect ? '#86efac' : '#e2e8f0'}; border-radius: 10px; padding: 6px 10px;"
        >
          <!-- Correct Answer Radio Button -->
          <button
            type="button"
            onclick={() => onSetCorrectOption(optIdx)}
            title="Klik untuk jadikan kunci jawaban benar"
            aria-label="Pilih opsi {optionLetters[optIdx]} sebagai kunci benar"
            style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid {opt.isCorrect ? '#16a34a' : '#cbd5e1'}; background: {opt.isCorrect ? '#16a34a' : '#ffffff'}; color: {opt.isCorrect ? '#ffffff' : '#64748b'}; font-weight: 800; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
          >
            {#if opt.isCorrect}
              <Icon name="check" size={14} />
            {:else}
              {optionLetters[optIdx]}
            {/if}
          </button>

          <!-- Option Text Input -->
          <input
            type="text"
            placeholder="Pilihan {optionLetters[optIdx]}..."
            bind:value={opt.text}
            style="flex: 1; min-width: 0; padding: 7px 10px; border: 1px solid {opt.isCorrect ? '#bbf7d0' : '#cbd5e1'}; border-radius: 6px; font-size: 0.875rem; background: #ffffff;"
          />

          {#if opt.isCorrect}
            <span style="font-size: 0.725rem; font-weight: 700; color: #166534; padding: 3px 6px; background: #dcfce7; border-radius: 6px; white-space: nowrap; flex-shrink: 0;">
              Kunci Benar
            </span>
          {/if}

          {#if question.options.length > 2}
            <button
              type="button"
              onclick={() => onRemoveOption(optIdx)}
              title="Hapus opsi ini"
              aria-label="Hapus opsi"
              style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; display: flex; align-items: center; flex-shrink: 0;"
            >
              <Icon name="xmark" size={15} />
            </button>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- Explanation / Pembahasan -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px;">
    <div style="display: flex; align-items: center; gap: 5px; font-weight: 700; font-size: 0.8rem; color: #1e293b; margin-bottom: 6px;">
      <Icon name="info-circle" size={14} style="color: #0f766e;" />
      <span>Pembahasan / Penjelasan Jawaban</span>
    </div>
    <textarea
      rows="2"
      placeholder="Tuliskan penjelasan detail mengapa pilihan kunci tersebut benar..."
      bind:value={question.explanation}
      style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; font-family: inherit; box-sizing: border-box;"
    ></textarea>
  </div>
</div>
