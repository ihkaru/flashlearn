const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function safeFromCodePoint(cp: number, fallback: string): string {
  if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return fallback;
  return String.fromCodePoint(cp);
}

export function decodeXmlEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (full, hex) => safeFromCodePoint(parseInt(hex, 16), full))
    .replace(/&#(\d+);/g, (full, dec) => safeFromCodePoint(parseInt(dec, 10), full))
    .replace(/&([a-zA-Z]+);/g, (full, name) => ENTITY_MAP[name] ?? full);
}

const DEFAULT_MAX_TOTAL_UNZIP_BYTES = 100 * 1024 * 1024; // 100 MB cap
const DEFAULT_MAX_ZIP_RATIO = 100;

/**
 * Bounded ZIP filter preventing Zip Bomb OOM DoS during EPUB/PPTX indexing.
 */
export function createSafeZipFilter(
  allowedPathPattern: RegExp,
  maxTotalBytes = DEFAULT_MAX_TOTAL_UNZIP_BYTES,
  maxRatio = DEFAULT_MAX_ZIP_RATIO
): (file: { name: string; size: number; originalSize: number }) => boolean {
  let cumulativeBytes = 0;
  return (file) => {
    if (!allowedPathPattern.test(file.name)) return false;
    const orig = Math.max(0, Number(file.originalSize) || 0);
    const comp = Math.max(1, Number(file.size) || 1);
    if (orig > maxTotalBytes || cumulativeBytes + orig > maxTotalBytes) {
      throw new Error(`Archive exceeds safe decompression limit (${maxTotalBytes} bytes).`);
    }
    if (orig > 64 * 1024 && orig / comp > maxRatio) {
      throw new Error(`Archive entry "${file.name}" exceeds safe compression ratio (${maxRatio}:1).`);
    }
    cumulativeBytes += orig;
    return true;
  };
}

export function xhtmlToMarkdown(rawHtml: string): string {
  let text = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  text = text
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|blockquote|tr)>/gi, '\n\n')
    .replace(/<\/(td|th)>/gi, ' | ')
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n')
    .replace(/<[^>]+>/g, '');

  return decodeXmlEntities(text)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function estimateTokens(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return Math.max(1, Math.ceil(cleaned.length / 4));
}

/**
 * Estimates deep active study minutes (reading + worked example + self-check)
 * without lossy skipping. Roughly ~220 tokens/minute of focused comprehension.
 */
export function estimateStudyMinutes(tokens: number): number {
  if (tokens <= 0) return 3;
  return Math.max(3, Math.ceil(tokens / 220));
}

export function slugifyText(input: string, fallback = 'item'): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return s || fallback;
}

export function splitMarkdownByTokenBudget(
  markdown: string,
  maxTokensPerSlice = 3200
): string[] {
  if (estimateTokens(markdown) <= maxTokensPerSlice) {
    return [markdown];
  }
  const paragraphs = markdown.split(/\n{2,}/);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const para of paragraphs) {
    const pTokens = estimateTokens(para);
    if (current.length > 0 && currentTokens + pTokens > maxTokensPerSlice) {
      chunks.push(current.join('\n\n'));
      current = [para];
      currentTokens = pTokens;
    } else {
      current.push(para);
      currentTokens += pTokens;
    }
  }
  if (current.length > 0) {
    chunks.push(current.join('\n\n'));
  }
  return chunks;
}
