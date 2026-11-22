import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import type {
  CorpusIndexDocument,
  CorpusSliceEntry,
  CorpusSourceEntry,
  CurriculumScaleClass,
} from '@flashlearn/shared';
import { extractEpubSource, type ExtractedSourceResult } from './extract-epub';
import { extractPptxSource } from './extract-pptx';
import { extractPdfSource } from './extract-pdf';
import {
  estimateStudyMinutes,
  estimateTokens,
  slugifyText,
  splitMarkdownByTokenBudget,
} from './xml-utils';

const SUPPORTED_EXTS = new Set(['.pdf', '.epub', '.pptx', '.md', '.markdown', '.txt']);

function collectInputFiles(inputs: string[]): string[] {
  const files: string[] = [];
  for (const raw of inputs) {
    const abs = resolve(raw);
    if (!existsSync(abs)) {
      throw new Error(`Input source not found: ${abs}`);
    }
    const st = statSync(abs);
    if (st.isDirectory()) {
      const entries = readdirSync(abs).sort();
      for (const name of entries) {
        const child = join(abs, name);
        if (statSync(child).isFile()) {
          const ext = extname(child).toLowerCase();
          if (ext === '.ppt') {
            throw new Error(
              `Legacy binary .ppt detected (${name}). Convert to .pptx first (e.g. \`soffice --headless --convert-to pptx "${child}"\`).`
            );
          }
          if (SUPPORTED_EXTS.has(ext)) files.push(child);
        }
      }
    } else {
      const ext = extname(abs).toLowerCase();
      if (ext === '.ppt') {
        throw new Error(
          `Legacy binary .ppt detected (${basename(abs)}). Convert to .pptx first (e.g. \`soffice --headless --convert-to pptx "${abs}"\`).`
        );
      }
      if (!SUPPORTED_EXTS.has(ext)) {
        throw new Error(`Unsupported source format '${ext}'. Supported: .pdf, .epub, .pptx, .md, .txt`);
      }
      files.push(abs);
    }
  }
  if (files.length === 0) {
    throw new Error('No supported source files (.pdf, .epub, .pptx, .md, .txt) found in inputs.');
  }
  return files;
}

function extractTextOrMarkdownSource(
  filePath: string,
  maxTokensPerSlice = 3200
): ExtractedSourceResult {
  const content = readFileSync(filePath, 'utf-8');
  const title = basename(filePath).replace(/\.(md|markdown|txt)$/i, '');
  const sections = content.split(/\n(?=#{1,2}\s+)/).filter((s) => s.trim().length > 0);
  const rawUnits = sections.length > 0 ? sections : [content];

  const slices = rawUnits.flatMap((sec, idx) => {
    const firstLine = sec.split('\n')[0].replace(/^#+\s*/, '').trim() || `Bagian ${idx + 1}`;
    const parts = splitMarkdownByTokenBudget(sec.trim(), maxTokensPerSlice);
    return parts.map((partMd, pIdx) => {
      const suffix = parts.length > 1 ? ` (${pIdx + 1}/${parts.length})` : '';
      return {
        heading: `${firstLine.slice(0, 90)}${suffix}`,
        locationTag: `${title} · Bagian ${idx + 1}${suffix}`,
        markdown: partMd,
      };
    });
  });

  return { title, totalUnits: rawUnits.length, slices };
}

function extractHeadingKeywords(heading: string): string[] {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !['bagian', 'halaman', 'slide', 'chapter'].includes(w));
}

function annotateCrossBookOverlaps(slices: CorpusSliceEntry[]): void {
  const kwToSlices = new Map<string, CorpusSliceEntry[]>();
  for (const sl of slices) {
    for (const kw of new Set(extractHeadingKeywords(sl.heading))) {
      const arr = kwToSlices.get(kw) || [];
      arr.push(sl);
      kwToSlices.set(kw, arr);
    }
  }

  for (const sl of slices) {
    const related = new Set<string>();
    for (const kw of extractHeadingKeywords(sl.heading)) {
      const peers = kwToSlices.get(kw) || [];
      for (const peer of peers) {
        if (peer.sourceId !== sl.sourceId) {
          related.add(`${peer.sliceId} (${peer.locationTag})`);
        }
      }
    }
    if (related.size > 0) {
      sl.overlapHints = Array.from(related).slice(0, 4);
    }
  }
}

export function classifyScale(totalTokens: number, totalSlices: number): CurriculumScaleClass {
  if (totalTokens <= 12_000 && totalSlices <= 4) return 'S';
  if (totalTokens <= 65_000 && totalSlices <= 18) return 'M';
  return 'L';
}

export async function indexMultiFormatCorpus(options: {
  inputs: string[];
  outDir: string;
  pagesPerPdfSlice?: number;
  slidesPerPptxSlice?: number;
  maxTokensPerSlice?: number;
}): Promise<{ indexPath: string; index: CorpusIndexDocument }> {
  const files = collectInputFiles(options.inputs);
  const absOut = resolve(options.outDir);
  const slicesDir = join(absOut, 'slices');
  mkdirSync(slicesDir, { recursive: true });

  const sources: CorpusSourceEntry[] = [];
  const allSlices: CorpusSliceEntry[] = [];
  let globalOrder = 0;

  for (let sIdx = 0; sIdx < files.length; sIdx++) {
    const filePath = files[sIdx];
    const ext = extname(filePath).toLowerCase();
    const sha256 = createHash('sha256').update(readFileSync(filePath)).digest('hex');
    const sourceId = `src-${String(sIdx + 1).padStart(2, '0')}-${slugifyText(basename(filePath, ext)).slice(0, 24)}`;

    let extracted: ExtractedSourceResult;
    let format: CorpusSourceEntry['format'];

    if (ext === '.pdf') {
      format = 'pdf';
      extracted = await extractPdfSource(filePath, {
        pagesPerSlice: options.pagesPerPdfSlice,
        maxTokensPerSlice: options.maxTokensPerSlice,
      });
    } else if (ext === '.epub') {
      format = 'epub';
      extracted = extractEpubSource(filePath, options.maxTokensPerSlice);
    } else if (ext === '.pptx') {
      format = 'pptx';
      extracted = extractPptxSource(filePath, options.slidesPerPptxSlice);
    } else {
      format = ext === '.txt' ? 'text' : 'markdown';
      extracted = extractTextOrMarkdownSource(filePath, options.maxTokensPerSlice);
    }

    let sourceTokens = 0;
    for (let i = 0; i < extracted.slices.length; i++) {
      globalOrder++;
      const rawSlice = extracted.slices[i];
      const sliceId = `${sourceId}-s${String(i + 1).padStart(3, '0')}`;
      const relFile = `slices/${sliceId}.md`;
      const tokens = estimateTokens(rawSlice.markdown);
      sourceTokens += tokens;

      const fileContent = [
        '---',
        `sliceId: ${sliceId}`,
        `sourceId: ${sourceId}`,
        `locationTag: "${rawSlice.locationTag.replace(/"/g, '\\"')}"`,
        `estimatedTokens: ${tokens}`,
        '---',
        '',
        rawSlice.markdown,
        '',
      ].join('\n');

      writeFileSync(join(absOut, relFile), fileContent, 'utf-8');

      allSlices.push({
        sliceId,
        sourceId,
        order: globalOrder,
        heading: rawSlice.heading,
        locationTag: rawSlice.locationTag,
        filePath: relFile,
        charCount: rawSlice.markdown.length,
        estimatedTokens: tokens,
        estimatedStudyMinutes: estimateStudyMinutes(tokens),
        needsVlmTriage: rawSlice.needsVlmTriage,
      });
    }

    sources.push({
      sourceId,
      fileName: basename(filePath),
      format,
      title: extracted.title,
      sha256,
      totalUnits: extracted.totalUnits,
      estimatedTokens: sourceTokens,
      visualTriagePages: extracted.visualTriagePages,
    });
  }

  annotateCrossBookOverlaps(allSlices);

  const totalEstimatedTokens = allSlices.reduce((acc, s) => acc + s.estimatedTokens, 0);
  const totalEstimatedStudyMinutes = allSlices.reduce((acc, s) => acc + s.estimatedStudyMinutes, 0);

  const index: CorpusIndexDocument = {
    schemaVersion: 'corpus-index-v1',
    createdAt: new Date().toISOString(),
    totalSources: sources.length,
    totalSlices: allSlices.length,
    totalEstimatedTokens,
    totalEstimatedStudyMinutes,
    recommendedScale: classifyScale(totalEstimatedTokens, allSlices.length),
    sources,
    slices: allSlices,
  };

  const indexPath = join(absOut, 'corpus-index.json');
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf-8');
  return { indexPath, index };
}
