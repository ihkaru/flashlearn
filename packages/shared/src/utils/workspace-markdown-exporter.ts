import type { Content, Domain, GlossaryTerm, Workspace } from '../types';
import {
  formatInteractiveModuleToMarkdown,
  type MarkdownExportOptions,
} from './interactive-markdown-formatter';

export interface WorkspaceMarkdownExportInput extends MarkdownExportOptions {
  workspace: Workspace;
  contents: Content[];
  domains?: Domain[];
}

export interface WorkspaceMarkdownExportResult {
  markdown: string;
  unitCount: number;
  moduleCount: number;
  charCount: number;
  approxTokens: number;
}

function formatQuizQuestions(content: Content): string {
  const qs = content.questions || [];
  if (qs.length === 0) return '';
  const lines: string[] = ['#### Daftar Soal & Latihan', ''];
  qs.forEach((q, idx) => {
    lines.push(`${idx + 1}. **${q.question}**`);
    for (const opt of q.options || []) {
      const mark = opt.isCorrect ? ' *(Jawaban Benar)*' : '';
      lines.push(`   - ${opt.text}${mark}`);
    }
    if (q.explanation?.trim()) {
      lines.push(`   - *Pembahasan*: ${q.explanation.trim()}`);
    }
    lines.push('');
  });
  return lines.join('\n').trim();
}

/**
 * Compiles any single FlashLearn Content item (interactive_module, materi, quiz, or combined)
 * into clean Markdown ready to paste into an AI chat assistant.
 */
export function exportContentToMarkdown(
  content: Content,
  options: MarkdownExportOptions = {}
): string {
  const sections: string[] = [`# ${content.title}`];

  if (content.type === 'interactive_module' && content.interactivePayload) {
    sections.push(formatInteractiveModuleToMarkdown(content, content.interactivePayload, options));
  } else {
    if (content.summary?.trim()) {
      sections.push(`> ${content.summary.trim()}`);
    }
    if (content.body?.trim()) {
      sections.push(content.body.trim());
    }
    const quizMd = formatQuizQuestions(content);
    if (quizMd) {
      sections.push(quizMd);
    }
  }

  return sections.filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

interface ExportUnitGroup {
  key: string;
  title: string;
  order: number;
  items: Content[];
}

function groupContentsByUnit(contents: Content[], domains: Domain[]): ExportUnitGroup[] {
  const domainMap = new Map(domains.map((d, idx) => [d.id, { domain: d, idx }]));
  const groups = new Map<string, ExportUnitGroup>();

  for (const c of contents) {
    if (c.deletedAt) continue;
    const meta = c.interactivePayload?.unitMeta;
    const domEntry = c.domainId ? domainMap.get(c.domainId) : undefined;
    const key = meta?.unitCode || domEntry?.domain.code || 'general';
    const title = meta?.unitTitle || domEntry?.domain.name || 'Materi Pembelajaran';
    const order = meta?.unitOrder ?? (domEntry ? domEntry.idx + 1 : 999);

    if (!groups.has(key)) {
      groups.set(key, { key, title, order, items: [] });
    }
    groups.get(key)!.items.push(c);
  }

  const sorted = Array.from(groups.values()).sort((a, b) => a.order - b.order);
  for (const g of sorted) {
    g.items.sort(
      (a, b) =>
        (a.interactivePayload?.unitMeta?.moduleOrder ?? 999) -
        (b.interactivePayload?.unitMeta?.moduleOrder ?? 999)
    );
  }
  return sorted;
}

/**
 * Compiles an entire FlashLearn Workspace (ordered units, all active modules,
 * slide summaries, figures, exercises, and deduplicated glossary) into a single
 * self-contained Markdown document ready for one-click copy into AI chat apps.
 */
export function exportWorkspaceToMarkdown(
  input: WorkspaceMarkdownExportInput
): WorkspaceMarkdownExportResult {
  const { workspace, contents, domains = [], assetOrigin } = input;
  const activeContents = contents.filter((c) => !c.deletedAt);
  const groups = groupContentsByUnit(activeContents, domains);
  const totalMinutes = activeContents.reduce(
    (sum, c) => sum + (c.readingTimeMinutes || c.interactivePayload?.estimatedMinutes || 5),
    0
  );

  const lines: string[] = [`# ${workspace.name}`, ''];
  if (workspace.description?.trim()) {
    lines.push(workspace.description.trim(), '');
  }
  lines.push(
    `- **Jumlah Unit/Pertemuan**: ${groups.length}`,
    `- **Jumlah Modul**: ${activeContents.length}`,
    `- **Estimasi Total Durasi**: ±${totalMinutes} menit`,
    ''
  );

  // Table of Contents for quick AI context scanning
  if (groups.length > 0) {
    lines.push('## Daftar Isi', '');
    groups.forEach((group, gIdx) => {
      lines.push(`${gIdx + 1}. **${group.title}**`);
      group.items.forEach((item, mIdx) => {
        lines.push(`   - ${gIdx + 1}.${mIdx + 1} ${item.title}`);
      });
    });
    lines.push('');
  }

  // Deduplicated glossary accumulator across all workspace modules
  const glossaryMap = new Map<string, GlossaryTerm>();

  groups.forEach((group, gIdx) => {
    lines.push('---', '', `## ${group.title}`, '');
    group.items.forEach((item, mIdx) => {
      lines.push(`### Modul ${gIdx + 1}.${mIdx + 1}: ${item.title}`, '');
      if (item.type === 'interactive_module' && item.interactivePayload) {
        for (const term of item.interactivePayload.glossary || []) {
          const norm = term.term.trim().toLowerCase();
          if (norm && !glossaryMap.has(norm)) {
            glossaryMap.set(norm, term);
          }
        }
        lines.push(formatInteractiveModuleToMarkdown(item, item.interactivePayload, { assetOrigin }), '');
      } else {
        if (item.summary?.trim()) lines.push(`> ${item.summary.trim()}`, '');
        if (item.body?.trim()) lines.push(item.body.trim(), '');
        const quizMd = formatQuizQuestions(item);
        if (quizMd) lines.push(quizMd, '');
      }
    });
  });

  if (glossaryMap.size > 0) {
    lines.push('---', '', '## Glosarium Gabungan Workspace', '');
    const sortedTerms = Array.from(glossaryMap.values()).sort((a, b) =>
      a.term.localeCompare(b.term)
    );
    for (const g of sortedTerms) {
      const anchor = g.highSchoolAnchor ? ` *(Padanan sederhana: ${g.highSchoolAnchor})*` : '';
      lines.push(`- **${g.term}**: ${g.definition}${anchor}`);
    }
    lines.push('');
  }

  const markdown = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  return {
    markdown,
    unitCount: groups.length,
    moduleCount: activeContents.length,
    charCount: markdown.length,
    approxTokens: Math.ceil(markdown.length / 4),
  };
}
