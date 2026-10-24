import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename } from 'node:path';

export interface ChunkMeta {
  locationTag: string;
  content: string;
  sha256: string;
}

export interface ParsedDoc {
  fileName: string;
  sourceCode: string;
  title: string;
  chunks: ChunkMeta[];
}

export interface ExtractedDomainRules {
  checklistItems: string[];
  numericalLimits: Array<{ key: string; value: number }>;
  prohibitions: string[];
  mandates: string[];
  dilemmaTriggers: string[];
}

const SECTION_REGEX = /(?:^|\n)(?:#+\s*)?(Pasal\s+\d+[a-z]?|BAB\s+[IVXLCDM]+|Bagian\s+[A-Za-z0-9]+|Lampiran\s+[A-Za-z0-9]+|Section\s+\d+|Article\s+\d+|##+\s+[^#\n]+)/gi;

export function parseMarkdownDocument(filePath: string, index: number): ParsedDoc {
  if (!existsSync(filePath)) {
    throw new Error(`INSUFFICIENT_DOMAIN_SPECIFICATION: Markdown file not found: ${filePath}`);
  }
  const raw = readFileSync(filePath, 'utf-8');
  return parseMarkdownText(raw, basename(filePath).replace(/\.[^/.]+$/, ''), index);
}

export function parseMarkdownText(rawText: string, titleHint: string, index: number): ParsedDoc {
  const raw = (rawText || '').replace(/\r\n/g, '\n').trim();
  if (!raw || raw.length < 15) {
    throw new Error('INSUFFICIENT_DOMAIN_SPECIFICATION: Markdown content is empty or too short');
  }

  const fileName = `${titleHint}.md`;
  const baseCode = titleHint.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 10);
  const sourceCode = `SRC-${baseCode || `DOC${index + 1}`}`;

  const h1Match = raw.match(/^#\s+(.+)$/m);
  const title = h1Match ? h1Match[1].trim() : titleHint;

  const matches: Array<{ tag: string; index: number }> = [];
  let m: RegExpExecArray | null;

  SECTION_REGEX.lastIndex = 0;
  while ((m = SECTION_REGEX.exec(raw)) !== null) {
    matches.push({ tag: m[1].replace(/^#+\s*/, '').trim(), index: m.index });
  }

  const chunks: ChunkMeta[] = [];
  if (matches.length === 0) {
    const paragraphs = raw.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    paragraphs.forEach((p, idx) => {
      const content = p.trim();
      chunks.push({
        locationTag: `Bagian ${idx + 1}`,
        content,
        sha256: createHash('sha256').update(content).digest('hex'),
      });
    });
  } else {
    for (let i = 0; i < matches.length; i++) {
      const cur = matches[i];
      const next = matches[i + 1];
      const content = (next ? raw.substring(cur.index, next.index) : raw.substring(cur.index)).trim();
      chunks.push({
        locationTag: cur.tag,
        content,
        sha256: createHash('sha256').update(content).digest('hex'),
      });
    }
  }

  return { fileName, sourceCode, title, chunks };
}

export function extractDomainRules(docs: ParsedDoc[]): ExtractedDomainRules {
  const checklistItems: string[] = [];
  const numericalLimits: Array<{ key: string; value: number }> = [];
  const prohibitions: string[] = [];
  const mandates: string[] = [];
  const dilemmaTriggers: string[] = [];

  const bulletRegex = /^\s*(?:[-*]|\d+\.|\([a-z0-9]\))\s+(.+)$/gm;
  const prohibitionWords = /(?:dilarang|tidak boleh|prohibited|must not|shall not|pelanggaran|sanksi)/i;
  const mandateWords = /(?:wajib|harus|shall|must|diwajibkan|persyaratan|standar)/i;
  const dilemmaWords = /(?:belum terlampir|darurat|tekanan|desakan|tenggat|menolak menandatangani|kompromi|omisi)/i;
  const numberRegex = /(\b[a-zA-Z_]{3,20}\b[^\n\d]{1,25})?(\d+(?:[.,]\d+)?)\s*(%|persen|kaki|bar|knot|ampere|menit|miliar|juta)?/gi;

  for (const doc of docs) {
    for (const chunk of doc.chunks) {
      const lines = chunk.content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        bulletRegex.lastIndex = 0;
        const bMatch = bulletRegex.exec(trimmed);
        const itemText = bMatch ? bMatch[1].trim() : trimmed;

        if (itemText.length >= 10) {
          if (prohibitionWords.test(itemText)) {
            prohibitions.push(itemText);
          } else if (mandateWords.test(itemText)) {
            mandates.push(itemText);
            checklistItems.push(itemText);
          } else if (bMatch) {
            checklistItems.push(itemText);
          }

          if (dilemmaWords.test(itemText)) {
            dilemmaTriggers.push(itemText);
          }
        }

        // Numerical limits extraction
        let nMatch: RegExpExecArray | null;
        numberRegex.lastIndex = 0;
        while ((nMatch = numberRegex.exec(trimmed)) !== null) {
          const rawNum = nMatch[2].replace(',', '.');
          const val = parseFloat(rawNum);
          if (!isNaN(val) && val > 0 && val < 1000000000000) {
            const labelRaw = (nMatch[1] || 'parameter').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
            const key = labelRaw ? `nilai_${labelRaw}` : 'nilai_standar';
            if (!numericalLimits.some((n) => n.key === key && n.value === val)) {
              numericalLimits.push({ key, value: val });
            }
          }
        }
      }
    }
  }

  // Validate integrity: Must contain extractable procedural criteria
  const totalActionable = checklistItems.length + prohibitions.length + mandates.length;
  if (totalActionable < 2) {
    throw new Error(
      'INSUFFICIENT_DOMAIN_SPECIFICATION: Input document must contain at least 2 extractable operational criteria or compliance rules'
    );
  }

  return { checklistItems, numericalLimits, prohibitions, mandates, dilemmaTriggers };
}
