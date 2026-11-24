import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { unzipSync } from 'fflate';
import { createSafeZipFilter, decodeXmlEntities, estimateTokens } from './xml-utils';
import type { ExtractedRawSlice, ExtractedSourceResult } from './extract-epub';

function extractPptxParagraphs(xml: string): string[] {
  const paragraphs: string[] = [];
  const pRegex = /<a:p\b[^>]*>([\s\S]*?)<\/a:p>/gi;
  let pm: RegExpExecArray | null;
  while ((pm = pRegex.exec(xml)) !== null) {
    const runs: string[] = [];
    const tRegex = /<a:t\b[^>]*>([\s\S]*?)<\/a:t>/gi;
    let tm: RegExpExecArray | null;
    while ((tm = tRegex.exec(pm[1])) !== null) {
      runs.push(decodeXmlEntities(tm[1]));
    }
    const line = runs.join('').replace(/\s+/g, ' ').trim();
    if (line.length > 0) paragraphs.push(line);
  }
  return paragraphs;
}

function parseSlideNumber(path: string): number {
  const m = path.match(/slide(\d+)\.xml$/i);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Pure TypeScript MIT PPTX extractor using fflate ZIP + DrawingML XML.
 * Preserves every slide text block and speaker notes verbatim with slide location tags.
 */
export function extractPptxSource(
  filePath: string,
  slidesPerSlice = 10
): ExtractedSourceResult {
  const rawBytes = new Uint8Array(readFileSync(filePath));
  const entries = unzipSync(rawBytes, {
    filter: createSafeZipFilter(/^ppt\/(?:slides\/slide|notesSlides\/notesSlide)\d+\.xml$/i),
  });

  const slidePaths = Object.keys(entries)
    .filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
    .sort((a, b) => parseSlideNumber(a) - parseSlideNumber(b));

  if (slidePaths.length === 0) {
    throw new Error(`Invalid PPTX archive (${basename(filePath)}): no slides found under ppt/slides/.`);
  }

  const deckTitle = basename(filePath).replace(/\.pptx$/i, '');
  const slidesRendered: Array<{ num: number; heading: string; md: string }> = [];

  for (const sPath of slidePaths) {
    const num = parseSlideNumber(sPath);
    const slideXml = new TextDecoder('utf-8').decode(entries[sPath]);
    const lines = extractPptxParagraphs(slideXml);
    const heading = lines[0] ? lines[0].slice(0, 95) : `Slide ${num}`;
    const bodyLines = lines.slice(1).map((l) => `- ${l}`);

    const notePath = `ppt/notesSlides/notesSlide${num}.xml`;
    let notesMd = '';
    if (entries[notePath]) {
      const noteXml = new TextDecoder('utf-8').decode(entries[notePath]);
      const noteLines = extractPptxParagraphs(noteXml).filter((l) => l !== String(num));
      if (noteLines.length > 0) {
        notesMd = `\n\n> Catatan Slide ${num}: ${noteLines.join(' ')}`;
      }
    }

    const md = `## Slide ${num}: ${heading}\n${bodyLines.join('\n')}${notesMd}`.trim();
    if (estimateTokens(md) >= 3) {
      slidesRendered.push({ num, heading, md });
    }
  }

  const slices: ExtractedRawSlice[] = [];
  for (let i = 0; i < slidesRendered.length; i += slidesPerSlice) {
    const group = slidesRendered.slice(i, i + slidesPerSlice);
    const first = group[0];
    const last = group[group.length - 1];
    const rangeTag = first.num === last.num ? `Slide ${first.num}` : `Slide ${first.num}-${last.num}`;
    slices.push({
      heading: `${first.heading} (${rangeTag})`,
      locationTag: `${deckTitle} · ${rangeTag}`,
      markdown: group.map((g) => g.md).join('\n\n---\n\n'),
    });
  }

  return {
    title: deckTitle,
    totalUnits: slidePaths.length,
    slices,
  };
}
