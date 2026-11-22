const EMOJI_PATTERN = /[\p{Extended_Pictographic}\uFE0F\u200D]/gu;

/**
 * Generates a clean 2-3 character typographic monogram from a workspace/domain
 * name or explicit non-emoji code, guaranteeing zero Unicode emoji rendering.
 */
export function getMonogram(name?: string | null, rawCode?: string | null): string {
  const cleanedCode = (rawCode || '').replace(EMOJI_PATTERN, '').trim();
  if (cleanedCode.length >= 1 && cleanedCode.length <= 4 && /^[A-Za-z0-9-]+$/.test(cleanedCode)) {
    return cleanedCode.slice(0, 3).toUpperCase();
  }

  const cleanedName = (name || '').replace(EMOJI_PATTERN, '').trim();
  if (!cleanedName) return 'FL';

  const words = cleanedName
    .split(/[\s/&_-]+/)
    .map((w) => w.replace(/[^A-Za-z0-9]/g, ''))
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return 'FL';
}
