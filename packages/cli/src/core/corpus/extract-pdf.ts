import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { extractText, getDocumentProxy } from 'unpdf';
import { estimateTokens, splitMarkdownByTokenBudget } from './xml-utils';
import type { ExtractedRawSlice, ExtractedSourceResult } from './extract-epub';

const LOW_TEXT_DENSITY_CHARS = 80;

/**
 * Pure TypeScript MIT PDF extractor built on unpdf (Mozilla pdf.js).
 * Cross-platform (Windows, macOS, Linux, Termux) with zero Poppler requirement.
 * Groups pages into lossless slices and flags low-text pages for optional selective VLM triage.
 */
export async function extractPdfSource(
  filePath: string,
  options: { pagesPerSlice?: number; maxTokensPerSlice?: number } = {}
): Promise<ExtractedSourceResult> {
  const pagesPerSlice = options.pagesPerSlice ?? 15;
  const maxTokensPerSlice = options.maxTokensPerSlice ?? 3400;
  const data = new Uint8Array(readFileSync(filePath));
  const pdf = await getDocumentProxy(data);

  const meta = await pdf.getMetadata().catch((err) => {
    console.debug('[corpus/pdf] metadata fallback:', err?.message || err);
    return null;
  });
  const infoTitle = (meta?.info as Record<string, any> | undefined)?.Title;
  const bookTitle =
    typeof infoTitle === 'string' && infoTitle.trim().length > 0
      ? infoTitle.trim()
      : basename(filePath).replace(/\.pdf$/i, '');

  const { totalPages, text: pages } = await extractText(pdf, { mergePages: false });
  const pageList = Array.isArray(pages) ? pages : [String(pages || '')];

  const visualTriagePages: number[] = [];
  pageList.forEach((pText, idx) => {
    if (String(pText || '').trim().length < LOW_TEXT_DENSITY_CHARS) {
      visualTriagePages.push(idx + 1);
    }
  });

  const slices: ExtractedRawSlice[] = [];
  for (let startIdx = 0; startIdx < pageList.length; startIdx += pagesPerSlice) {
    const endIdx = Math.min(pageList.length, startIdx + pagesPerSlice);
    const startPage = startIdx + 1;
    const endPage = endIdx;

    const batchSections: string[] = [];
    let batchNeedsVlm = false;
    for (let i = startIdx; i < endIdx; i++) {
      const pNum = i + 1;
      const cleaned = String(pageList[i] || '').replace(/\r\n/g, '\n').trim();
      if (cleaned.length < LOW_TEXT_DENSITY_CHARS) {
        batchNeedsVlm = true;
        batchSections.push(`<!-- Page ${pNum}: low text density (visual/scan triage candidate) -->\n${cleaned}`);
      } else {
        batchSections.push(`### Halaman ${pNum}\n${cleaned}`);
      }
    }

    const combined = batchSections.join('\n\n').trim();
    if (estimateTokens(combined) < 5 && !batchNeedsVlm) continue;

    const firstHeadingMatch = combined.match(/^#{1,3}\s+(.+)$/m);
    const firstNonEmpty = combined
      .split('\n')
      .find((l) => l.trim().length > 8 && !l.startsWith('<!--') && !l.startsWith('### Halaman'));
    const baseHeading = (firstNonEmpty || firstHeadingMatch?.[1] || `Halaman ${startPage}-${endPage}`)
      .replace(/^#+\s*/, '')
      .trim()
      .slice(0, 90);

    const parts = splitMarkdownByTokenBudget(combined, maxTokensPerSlice);
    parts.forEach((partMd, partIdx) => {
      const partSuffix = parts.length > 1 ? ` (Bagian ${partIdx + 1}/${parts.length})` : '';
      const pageRange = startPage === endPage ? `Hal. ${startPage}` : `Hal. ${startPage}-${endPage}`;
      slices.push({
        heading: `${baseHeading}${partSuffix}`,
        locationTag: `${bookTitle} · ${pageRange}${partSuffix}`,
        markdown: partMd,
        needsVlmTriage: batchNeedsVlm || undefined,
      });
    });
  }

  return {
    title: bookTitle,
    totalUnits: totalPages || pageList.length,
    visualTriagePages: visualTriagePages.length > 0 ? visualTriagePages : undefined,
    slices,
  };
}
