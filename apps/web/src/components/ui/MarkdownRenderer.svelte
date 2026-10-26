<script lang="ts">
  import { Marked } from 'marked';
  import { markedAlert } from '../../lib/utils/markedAlert';
  import markedKatex from 'marked-katex-extension';
  import DOMPurify from 'dompurify';
  import hljs from 'highlight.js/lib/common';

  interface Props {
    content?: string;
    class?: string;
  }

  let { content = '', class: customClass = '' }: Props = $props();

  const parser = new Marked();
  parser.use(markedAlert());
  parser.use(markedKatex({ throwOnError: false }));
  parser.use({
    gfm: true,
    breaks: true,
    renderer: {
      table({ header, rows }: { header: string; rows: string }) {
        return `<div class="markdown-table-wrapper"><table><thead>${header}</thead><tbody>${rows}</tbody></table></div>`;
      },
      code({ text, lang }: { text: string; lang?: string }) {
        const validLang = lang && hljs.getLanguage(lang) ? lang : undefined;
        let highlighted = text;
        try {
          highlighted = validLang
            ? hljs.highlight(text, { language: validLang, ignoreIllegals: true }).value
            : hljs.highlightAuto(text).value;
        } catch {
          highlighted = text;
        }
        const encoded = encodeURIComponent(text);
        return `<div class="fl-code-block"><div class="fl-code-header"><span class="fl-code-lang">${validLang || 'text'}</span><button type="button" class="fl-copy-btn" onclick="navigator.clipboard.writeText(decodeURIComponent('${encoded}'))">Salin</button></div><pre><code class="hljs language-${validLang || 'text'}">${highlighted}</code></pre></div>`;
      },
    },
  });

  const purifyConfig = {
    ADD_TAGS: [
      'math', 'annotation', 'semantics', 'mrow', 'mi', 'mn', 'mo', 'msup', 'msub',
      'mfrac', 'mover', 'munder', 'msqrt', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'svg', 'path', 'circle', 'line', 'polygon',
    ],
    ADD_ATTR: [
      'target', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
      'stroke-linejoin', 'd', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
      'points', 'xmlns', 'aria-hidden', 'onclick',
    ],
  };

  let html = $derived.by(() => {
    if (!content) return '';
    try {
      const rawHtml = parser.parse(content) as string;
      return DOMPurify.sanitize(rawHtml, purifyConfig);
    } catch {
      return content;
    }
  });
</script>

<div class="markdown-body {customClass}">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html html}
</div>
