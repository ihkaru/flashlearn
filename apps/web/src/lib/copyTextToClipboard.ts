export interface ClipboardCopyResult {
  ok: boolean;
  method: 'clipboard' | 'execCommand' | 'failed';
}

/**
 * Copies text to clipboard synchronously inside a user tap/click gesture,
 * with automatic textarea + execCommand fallback for older mobile WebViews.
 */
export async function copyTextToClipboard(text: string): Promise<ClipboardCopyResult> {
  if (!text) return { ok: false, method: 'failed' };

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: 'clipboard' };
    } catch {
      // Fall through to execCommand fallback
    }
  }

  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    try {
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (ok) return { ok: true, method: 'execCommand' };
    } catch {
      document.body.removeChild(textarea);
    }
  }

  return { ok: false, method: 'failed' };
}

export function downloadMarkdownFile(filename: string, markdown: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
