<script lang="ts">
  import Icon from '../ui/Icon.svelte';
  import { copyTextToClipboard, downloadMarkdownFile } from '../../lib/copyTextToClipboard';

  interface ExportPayload {
    markdown: string;
    metaLabel?: string;
    filename?: string;
  }

  interface Props {
    label?: string;
    compact?: boolean;
    disabled?: boolean;
    title?: string;
    getExport: () => ExportPayload;
  }

  let {
    label = 'Salin Full Materi (MD)',
    compact = false,
    disabled = false,
    title = 'Salin seluruh materi sebagai Markdown untuk ditanyakan langsung di AI chat',
    getExport,
  }: Props = $props();

  let status = $state<'idle' | 'copied' | 'downloaded'>('idle');
  let feedbackMeta = $state('');
  let resetTimer: ReturnType<typeof setTimeout> | null = null;

  async function handleClick() {
    if (disabled) return;
    const { markdown, metaLabel = '', filename = 'materi-flashlearn.md' } = getExport();
    if (!markdown.trim()) return;

    const result = await copyTextToClipboard(markdown);
    if (result.ok) {
      status = 'copied';
      feedbackMeta = metaLabel;
    } else {
      downloadMarkdownFile(filename, markdown);
      status = 'downloaded';
      feedbackMeta = '';
    }

    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      status = 'idle';
      feedbackMeta = '';
    }, 3200);
  }
</script>

<button
  type="button"
  onclick={handleClick}
  {disabled}
  {title}
  class="fl-btn {compact ? 'fl-btn-sm' : 'fl-btn-md'} fl-pill-btn"
  style="background: {status !== 'idle' ? '#f0fdf4' : '#f0fdfa'}; color: {status !== 'idle' ? '#15803d' : '#0f766e'}; border: 1px solid {status !== 'idle' ? '#86efac' : '#99f6e4'}; font-weight: 700; opacity: {disabled ? 0.5 : 1};"
>
  <Icon name={status === 'copied' ? 'check' : status === 'downloaded' ? 'download' : 'clipboard'} size={compact ? 14 : 15} />
  <span>
    {#if status === 'copied'}
      Tersalin!{feedbackMeta ? ` (${feedbackMeta})` : ''}
    {:else if status === 'downloaded'}
      Diunduh .md
    {:else}
      {label}
    {/if}
  </span>
</button>
