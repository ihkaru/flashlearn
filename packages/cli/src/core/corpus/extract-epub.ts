import { readFileSync } from 'node:fs';
import { basename, posix } from 'node:path';
import { unzipSync } from 'fflate';
import {
  decodeXmlEntities,
  estimateTokens,
  splitMarkdownByTokenBudget,
  xhtmlToMarkdown,
} from './xml-utils';

export interface ExtractedRawSlice {
  heading: string;
  locationTag: string;
  markdown: string;
  needsVlmTriage?: boolean;
}

export interface ExtractedSourceResult {
  title: string;
  totalUnits: number;
  visualTriagePages?: number[];
  slices: ExtractedRawSlice[];
}

function readZipText(entries: Record<string, Uint8Array>, path: string): string | null {
  const normalized = path.replace(/^\/+/, '');
  const buf = entries[normalized];
  if (!buf) return null;
  return new TextDecoder('utf-8').decode(buf);
}

function parseOpfManifest(opfXml: string): {
  title: string;
  manifest: Map<string, string>;
  spineIds: string[];
} {
  const titleMatch = opfXml.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i);
  const title = titleMatch ? decodeXmlEntities(titleMatch[1].replace(/<[^>]+>/g, '').trim()) : '';

  const manifest = new Map<string, string>();
  const itemRegex = /<item\b([^>]+)\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(opfXml)) !== null) {
    const attrs = m[1];
    const id = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1];
    const href = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (id && href) {
      manifest.set(id, decodeURIComponent(href));
    }
  }

  const spineIds: string[] = [];
  const itemrefRegex = /<itemref\b([^>]+)\/?>/gi;
  while ((m = itemrefRegex.exec(opfXml)) !== null) {
    const idref = m[1].match(/\bidref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (idref) spineIds.push(idref);
  }

  return { title, manifest, spineIds };
}

function extractFirstHeading(markdown: string, fallback: string): string {
  const match = markdown.match(/^#{1,3}\s+(.+)$/m);
  if (match && match[1].trim().length > 0) {
    return match[1].trim().slice(0, 100);
  }
  const firstLine = markdown.split('\n').find((l) => l.trim().length > 0);
  return firstLine ? firstLine.trim().slice(0, 90) : fallback;
}

/**
 * Pure TypeScript MIT EPUB extractor using fflate ZIP + OPF spine parsing.
 * Works identically on Windows, macOS, Linux, and Termux ARM64 with zero AGPL code.
 */
export function extractEpubSource(
  filePath: string,
  maxTokensPerSlice = 3200
): ExtractedSourceResult {
  const rawBytes = new Uint8Array(readFileSync(filePath));
  const entries = unzipSync(rawBytes);

  const containerXml = readZipText(entries, 'META-INF/container.xml');
  const opfPath =
    containerXml?.match(/full-path\s*=\s*["']([^"']+)["']/i)?.[1] ||
    Object.keys(entries).find((k) => k.toLowerCase().endsWith('.opf'));

  if (!opfPath) {
    throw new Error(`Invalid EPUB archive (${basename(filePath)}): missing OPF manifest.`);
  }

  const opfXml = readZipText(entries, opfPath);
  if (!opfXml) {
    throw new Error(`Invalid EPUB archive (${basename(filePath)}): unreadable OPF at ${opfPath}.`);
  }

  const opfDir = posix.dirname(opfPath) === '.' ? '' : posix.dirname(opfPath);
  const { title: opfTitle, manifest, spineIds } = parseOpfManifest(opfXml);
  const bookTitle = opfTitle || basename(filePath).replace(/\.epub$/i, '');

  const chapterPaths: string[] = [];
  for (const id of spineIds) {
    const href = manifest.get(id);
    if (!href) continue;
    const resolved = opfDir ? posix.join(opfDir, href) : href;
    if (/\.(xhtml|html|htm)$/i.test(resolved)) {
      chapterPaths.push(resolved);
    }
  }

  const slices: ExtractedRawSlice[] = [];
  let chapterNum = 0;

  for (const chPath of chapterPaths) {
    const xhtml = readZipText(entries, chPath);
    if (!xhtml) continue;
    const md = xhtmlToMarkdown(xhtml);
    if (estimateTokens(md) < 15) continue;

    chapterNum++;
    const baseHeading = extractFirstHeading(md, `Bagian ${chapterNum}`);
    const parts = splitMarkdownByTokenBudget(md, maxTokensPerSlice);

    parts.forEach((partMd, idx) => {
      const suffix = parts.length > 1 ? ` (Bagian ${idx + 1}/${parts.length})` : '';
      slices.push({
        heading: `${baseHeading}${suffix}`,
        locationTag: `${bookTitle} · Bab ${chapterNum}${suffix}`,
        markdown: partMd,
      });
    });
  }

  return {
    title: bookTitle,
    totalUnits: chapterNum,
    slices,
  };
}
