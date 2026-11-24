<script lang="ts">
  import { learningFeedback } from '../../lib/learningFeedback.svelte';
</script>

<button
  type="button"
  onclick={() => learningFeedback.toggleSound()}
  class="fl-btn fl-btn-sm fl-pill-btn"
  aria-pressed={learningFeedback.soundEnabled}
  title={learningFeedback.soundEnabled
    ? 'Matikan efek suara belajar'
    : 'Aktifkan efek suara progres belajar (Web Audio)'}
  style="background: {learningFeedback.soundEnabled
    ? 'var(--ws-accent-soft, #f0fdfa)'
    : '#f8fafc'}; color: {learningFeedback.soundEnabled
    ? 'var(--ws-accent-ink, #115e59)'
    : '#475569'}; border: 1px solid {learningFeedback.soundEnabled
    ? 'var(--ws-accent-border, #99f6e4)'
    : '#cbd5e1'}; font-weight: 700; gap: 6px;"
>
  <span
    style="width: 7px; height: 7px; border-radius: 50%; background: {learningFeedback.soundEnabled
      ? 'var(--ws-accent, #0f766e)'
      : '#94a3b8'}; display: inline-block;"
    aria-hidden="true"
  ></span>
  <span>{learningFeedback.soundEnabled ? 'Suara Aktif' : 'Suara Senyap'}</span>
</button>
