import { describe, expect, it } from 'bun:test';
import {
  exportContentToMarkdown,
  exportWorkspaceToMarkdown,
  type Content,
  type Workspace,
} from '../src';

const sampleWorkspace: Workspace = {
  id: 'ws-1',
  name: 'Profit First — Mesin Pencetak Laba',
  slug: 'profit-first',
  description: 'Kurikulum utuh 5 unit pengelolaan kas bisnis.',
  coverImage: null,
  icon: 'PF',
  isPublic: true,
  creatorId: 'u-1',
  creatorName: 'Super Admin',
  createdAt: '2026-11-22T00:00:00Z',
  updatedAt: '2026-11-22T00:00:00Z',
};

function createInteractiveContent(id: string, title: string, unitOrder: number, moduleOrder: number): Content {
  return {
    id,
    workspaceId: 'ws-1',
    title,
    slug: id,
    type: 'interactive_module',
    summary: `Ringkasan ${title}`,
    readingTimeMinutes: 8,
    body: null,
    questions: null,
    isPublished: true,
    createdAt: '2026-11-22T00:00:00Z',
    updatedAt: '2026-11-22T00:00:00Z',
    interactivePayload: {
      schemaVersion: 'uila-v2',
      knowledgeProfile: 'procedural_do',
      estimatedMinutes: 8,
      learningObjective: `Menguasai ${title}`,
      unitMeta: {
        unitCode: `U0${unitOrder}`,
        unitTitle: `Pertemuan ${unitOrder}: Unit ${unitOrder}`,
        unitOrder,
        moduleOrder,
      },
      hingeCheck: {
        prompt: 'Berapa sel A2 jika bahan baku hanya 5%?',
        options: [
          { id: 'a', text: 'Rp0', isCorrect: true, feedback: 'Di bawah ambang 25%.' },
          { id: 'b', text: '5% omzet', isCorrect: false, feedback: 'Hanya diisi bila >= 25%.' },
        ],
        remediationCard: 'Abaikan Material & Subs bila < 25%.',
      },
      figures: [
        {
          id: 'fig-4',
          assetUrl: '/api/v1/assets/abc-123',
          caption: 'Figure 4: Tabel 6 Tangga TAPs',
          altText: 'Tabel alokasi target 6 kolom.',
          stepKind: 'mechanics',
          sourceRef: 'Profit First',
          sourcePage: 71,
          annotations: [{ label: 'TAPs', explanation: 'Target Allocation Percentages.' }],
        },
      ],
      slideNotes: [
        { id: 's1', index: 0, title: 'Judul Slide', purpose: 'Membuka masalah', talk: ['Poin A', 'Poin B'] },
      ],
      glossary: [
        { term: 'Real Revenue', definition: 'Pendapatan Riil setelah bahan baku.', highSchoolAnchor: 'Uang bersih di laci kasir' },
      ],
      sourceCitations: [
        { sourceRef: 'Profit First (2017)', locationTag: 'Hal. 71', verbatimQuote: 'Real Revenue is what you actually keep.' },
      ],
      uila: {
        groundingDecision: {
          mode: 'direct_formalism',
          priorKnowledgeAssumed: 'partial',
          setupCostSeconds: 15,
          rationale: 'Prosedur langsung.',
        },
        block1_anomaly: {
          groundState: 'Kontraktor omzet 5M vs studio 1M.',
          oldWay: 'Membandingkan omzet kotor.',
          breakdownPoint: '4M kontraktor habis ke semen & subkon.',
        },
        block2_grounding: {},
        block3_coreMechanics: {
          invariantProperty: 'Semua persentase dihitung dari Real Revenue, bukan omzet kotor.',
          variableComponents: ['Top Line Revenue', 'Material & Subs'],
          contrastingCases: [
            { beginnerMisconception: 'Gaji karyawan tetap masuk A2.', physicalReality: 'Gaji tetap masuk OPEX.' },
          ],
        },
        block4_notationContract: {
          formulaOrCode: 'Real Revenue = A1 - A2',
          minimalFormalization: 'Kurangkan bahan baku >= 25% dari omzet kotor.',
          termsDeconstruction: [{ symbol: 'A3', physicalMeaning: 'Real Revenue' }],
          workedExampleSummary: '5M - 4M = 1M.',
        },
        block5_stressTest: {
          probeType: 'prediction_what_if',
          prompt: 'Omzet 2M, bahan baku 5%. Berapa Real Revenue?',
          options: [
            { optionId: 'o1', text: '2M penuh', isCorrect: true, causalRationale: '5% di bawah ambang 25%.' },
            { optionId: 'o2', text: '1.9M', isCorrect: false, diagnosticAxis: 'conceptGap', causalRationale: 'Ambang 25% tidak terlampaui.' },
            { optionId: 'o3', text: '0', isCorrect: false, diagnosticAxis: 'reasoningBug', causalRationale: 'Keliru.' },
          ],
          hintLadder: {
            level0Reflective: 'Cek ambang 25%.',
            level1Directional: 'Bandingkan 5% dengan 25%.',
            level2Constraint: 'Jika <25%, A2 = 0.',
            level3WorkedExample: '2M - 0 = 2M.',
          },
          groundTruth: '2M penuh',
        },
      },
    },
  };
}

describe('Workspace & Content Full Markdown Exporter', () => {
  it('exports full workspace ordered by unit & module, excluding soft-deleted items and deduplicating glossary', () => {
    const m2 = createInteractiveContent('m2', 'Instant Assessment', 2, 1);
    const m1 = createInteractiveContent('m1', 'Rumus Laba Baru', 1, 1);
    const deleted: Content = { ...createInteractiveContent('m-del', 'Arsip', 1, 2), deletedAt: '2026-11-22T01:00:00Z' };
    const materi: Content = {
      id: 'm3',
      workspaceId: 'ws-1',
      title: 'Catatan Tambahan',
      slug: 'catatan',
      type: 'materi',
      summary: 'Ringkasan teks',
      readingTimeMinutes: 4,
      body: 'Paragraf materi biasa.',
      questions: null,
      isPublished: true,
      createdAt: '2026-11-22T00:00:00Z',
      updatedAt: '2026-11-22T00:00:00Z',
    };

    const res = exportWorkspaceToMarkdown({
      workspace: sampleWorkspace,
      contents: [m2, deleted, materi, m1],
      assetOrigin: 'https://learn.dvlpid.my.id',
    });

    expect(res.moduleCount).toBe(3);
    expect(res.unitCount).toBe(3);
    expect(res.charCount).toBe(res.markdown.length);
    expect(res.approxTokens).toBeGreaterThan(100);

    // Ordering check: Unit 1 comes before Unit 2
    expect(res.markdown.indexOf('Pertemuan 1: Unit 1')).toBeLessThan(
      res.markdown.indexOf('Pertemuan 2: Unit 2')
    );
    // Soft-deleted excluded
    expect(res.markdown).not.toContain('Arsip');
    // Full lossless sections present
    expect(res.markdown).toContain('## Daftar Isi');
    expect(res.markdown).toContain('Real Revenue = A1 - A2');
    expect(res.markdown).toContain('https://learn.dvlpid.my.id/api/v1/assets/abc-123');
    expect(res.markdown).toContain('Ringkasan Slide Visual');
    expect(res.markdown).toContain('Paragraf materi biasa.');
    // Consolidated glossary deduplicates 'Real Revenue' (appears once under consolidated heading)
    const consolidatedSection = res.markdown.split('## Glosarium Gabungan Workspace')[1] || '';
    const occurrences = consolidatedSection.match(/\*\*Real Revenue\*\*/g) || [];
    expect(occurrences.length).toBe(1);
  });

  it('exports a single quiz content cleanly with questions and answers', () => {
    const quiz: Content = {
      id: 'q1',
      workspaceId: 'ws-1',
      title: 'Kuis Cepat',
      slug: 'kuis-cepat',
      type: 'quiz',
      summary: 'Uji singkat',
      readingTimeMinutes: 3,
      body: null,
      questions: [
        {
          id: 'qq1',
          question: '2 + 2 = ?',
          difficulty: 'easy',
          explanation: 'Penjumlahan dasar.',
          options: [
            { id: 'a', text: '4', isCorrect: true },
            { id: 'b', text: '5', isCorrect: false },
          ],
        },
      ],
      isPublished: true,
      createdAt: '2026-11-22T00:00:00Z',
      updatedAt: '2026-11-22T00:00:00Z',
    };

    const md = exportContentToMarkdown(quiz);
    expect(md).toContain('# Kuis Cepat');
    expect(md).toContain('2 + 2 = ?');
    expect(md).toContain('*(Jawaban Benar)*');
    expect(md).toContain('Penjumlahan dasar.');
  });
});
