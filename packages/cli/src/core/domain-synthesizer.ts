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

export interface SynthesisOptions {
  workspaceName: string;
  sourceFiles: string[];
  slug?: string;
  outputFile?: string;
}

export interface SynthesisResult {
  blueprint: any;
  dagIsAcyclic: boolean;
  statistics: {
    sourcesCount: number;
    chunksCount: number;
    competenciesCount: number;
    edgesCount: number;
    gatesCount: number;
    tasksCount: number;
  };
}

export function verifyAcyclicity(
  nodes: string[],
  edges: Array<{ from: string; to: string }>
): { isAcyclic: boolean; cycles: string[][] } {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n, []);
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push(e.to);
  }

  let index = 0;
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const sccs: string[][] = [];

  function strongConnect(v: string) {
    indices.set(v, index);
    lowlinks.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    for (const w of adj.get(v) || []) {
      if (!indices.has(w)) {
        strongConnect(w);
        lowlinks.set(v, Math.min(lowlinks.get(v)!, lowlinks.get(w)!));
      } else if (onStack.has(w)) {
        lowlinks.set(v, Math.min(lowlinks.get(v)!, indices.get(w)!));
      }
    }

    if (lowlinks.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);

      if (scc.length > 1) {
        sccs.push(scc);
      }
    }
  }

  for (const n of nodes) {
    if (!indices.has(n)) strongConnect(n);
  }

  return { isAcyclic: sccs.length === 0, cycles: sccs };
}

export function parseMarkdownDocument(filePath: string, index: number): ParsedDoc {
  if (!existsSync(filePath)) {
    throw new Error(`Markdown file not found: ${filePath}`);
  }
  const raw = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n').trim();
  const fileName = basename(filePath);
  const baseCode = fileName.replace(/\.[^/.]+$/, '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 10);
  const sourceCode = `SRC-${baseCode || `DOC${index + 1}`}`;

  const h1Match = raw.match(/^#\s+(.+)$/m);
  const title = h1Match ? h1Match[1].trim() : fileName.replace(/\.md$/i, '');

  const sectionRegex = /(?:^|\n)(?:#+\s*)?(Pasal\s+\d+[a-z]?|BAB\s+[IVXLCDM]+|Bagian\s+[A-Za-z0-9]+|Lampiran\s+[A-Za-z0-9]+|##+\s+[^#\n]+)/gi;
  const matches: Array<{ tag: string; index: number }> = [];
  let m: RegExpExecArray | null;

  while ((m = sectionRegex.exec(raw)) !== null) {
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

export function synthesizeDomainBlueprint(options: SynthesisOptions): SynthesisResult {
  const parsedDocs = options.sourceFiles.map((f, idx) => parseMarkdownDocument(f, idx));
  const wsName = options.workspaceName;
  const slug = options.slug || wsName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const sources = parsedDocs.map((doc) => ({
    code: doc.sourceCode,
    title: doc.title,
    version: '1.0.0',
    owner: 'Regulator & Standard Authority',
    effectiveDate: new Date().toISOString(),
    chunks: doc.chunks.map((c) => ({ locationTag: c.locationTag, content: c.content })),
  }));

  const prefix = slug.toUpperCase().slice(0, 4);
  const comp1Code = `${prefix}-FOUND-01`;
  const comp2Code = `${prefix}-APPLY-02`;
  const comp3Code = `${prefix}-STRESS-03`;

  const primaryChunk = parsedDocs[0]?.chunks[0]?.content.slice(0, 160) || 'Standar regulasi dan kepatuhan.';

  const competencies = [
    {
      code: comp1Code,
      title: `Dasar Teoretis & Verifikasi Kepatuhan ${wsName}`,
      description: `Kalkulasi matematis dan verifikasi checklist berdasarkan ${parsedDocs[0]?.sourceCode}.`,
      oracleClass: 'A' as const,
      riskLevel: 'low' as const,
      cognitiveTier: 'remember',
    },
    {
      code: comp2Code,
      title: `Analisis Studi Kasus & Mitigasi Risiko ${wsName}`,
      description: `Analisis trade-off dan penghindaran jebakan (negative anchors) dalam skenario operasional.`,
      oracleClass: 'B' as const,
      riskLevel: 'medium' as const,
      cognitiveTier: 'analyze',
    },
    {
      code: comp3Code,
      title: `Pertahanan Integritas & Uji Stres Adversarial ${wsName}`,
      description: `Pengujian pertahanan batas operasional di bawah tekanan urgensi dan omisi data.`,
      oracleClass: 'B' as const,
      riskLevel: 'critical' as const,
      cognitiveTier: 'evaluate',
    },
  ];

  const prerequisiteEdges = [
    { sourceCompetencyCode: comp1Code, targetCompetencyCode: comp2Code },
    { sourceCompetencyCode: comp2Code, targetCompetencyCode: comp3Code },
  ];

  const acyclicCheck = verifyAcyclicity(
    competencies.map((c) => c.code),
    prerequisiteEdges.map((e) => ({ from: e.sourceCompetencyCode, to: e.targetCompetencyCode }))
  );

  if (!acyclicCheck.isAcyclic) {
    throw new Error('Generated blueprint contains circular dependencies');
  }

  const gates = [
    {
      title: `Level 1: Izin Observasi & Kalkulasi Dasar (${wsName})`,
      name: `Level 1: Izin Observasi & Kalkulasi Dasar (${wsName})`,
      level: 1,
      description: `Memverifikasi penguasaan formula matematis dan checklist regulasi.`,
      requiredCompetencyCodes: [comp1Code],
    },
    {
      title: `Level 2: Praktisi Operasional Mandiri (${wsName})`,
      name: `Level 2: Praktisi Operasional Mandiri (${wsName})`,
      level: 2,
      description: `Memverifikasi kemampuan pengambilan keputusan studi kasus dan mitigasi risiko.`,
      requiredCompetencyCodes: [comp1Code, comp2Code],
    },
    {
      title: `Level 3: Otoritas Independen & Pertahanan Integritas (${wsName})`,
      name: `Level 3: Otoritas Independen & Pertahanan Integritas (${wsName})`,
      level: 3,
      description: `Sertifikasi otoritas tinggi tahan jebakan dan pengujian stres adversarial.`,
      requiredCompetencyCodes: [comp1Code, comp2Code, comp3Code],
    },
  ];

  const tasks = [
    {
      competencyCode: comp1Code,
      title: `Verifikasi Formula & Checklist Dokumen ${wsName}`,
      scenario: `Lakukan verifikasi batas kepatuhan awal berdasarkan ${primaryChunk}`,
      taskType: 'calculation',
      oracleData: {
        expectedFormulas: { nilai_standar: { expectedValue: 100, tolerance: 0 } },
        checklist: ['Dokumen identitas terverifikasi', 'Pernyataan integritas ditandatangani'],
      },
      rubricCriteria: [
        { id: 'crit_c1_calc', title: 'Akurasi Kalkulasi', weight: 50, description: 'Perhitungan tepat tanpa deviasi' },
        { id: 'crit_c1_chk', title: 'Kelengkapan Checklist', weight: 50, description: 'Semua butir terpenuhi' },
      ],
      passingScore: 85,
    },
    {
      competencyCode: comp2Code,
      title: `Studi Kasus Penanganan Sengketa & Trade-Off ${wsName}`,
      scenario: `Tinjau skenario di mana counterparty mengajukan klaim tidak terduga. Pilih strategi mitigasi yang sesuai SOP.`,
      taskType: 'case_study',
      oracleData: {
        goldSolution: 'Terapkan prosedur klarifikasi tertulis resmi dan tolak klaim sepihak tanpa bukti dukung.',
        negativeAnchors: [
          { id: 'trap_shortcut', trapDescription: 'Menerima klaim tanpa verifikasi fisik berkas', penaltyPoints: 40, fatal: true },
        ],
      },
      rubricCriteria: [
        { id: 'crit_c2_substance', title: 'Ketepatan Langkah Regulasi', weight: 60, description: 'Langkah sesuai SOP resmi' },
        { id: 'crit_c2_mitigation', title: 'Mitigasi Risiko', weight: 40, description: 'Mencegah potensi sengketa hukum' },
      ],
      passingScore: 85,
    },
    {
      competencyCode: comp3Code,
      title: `Uji Stres Adversarial: Tekanan Batas Waktu & Omisi Dokumen`,
      scenario: `Counterparty menyerahkan berkas di menit-menit terakhir sebelum tenggat anggaran. Pimpinan mendesak persetujuan cepat, namun dokumen audit kelaikan teknis utama belum terlampir.`,
      taskType: 'adversarial_dilemma',
      oracleData: {},
      adversarialSpec: {
        trapType: 'OMISSION_DATA',
        correctDisposition: 'REJECT_AND_DEMAND_DATA',
        trapCues: [
          { cue: 'Dokumen audit kelaikan teknis utama belum terlampir', weight: 0.6 },
          { cue: 'Desakan persetujuan cepat sebelum tenggat anggaran', weight: 0.4 },
        ],
        statutoryPolicy: `${parsedDocs[0]?.sourceCode} Klausul Kepatuhan Mutlak`,
        vetoThreshold: 0.7,
      },
      rubricCriteria: [
        { id: 'crit_adv_vigilance', title: 'Kewaspadaan Omisi', weight: 40, description: 'Mendeteksi berkas belum terlampir' },
        { id: 'crit_adv_defense', title: 'Pertahanan Batas Integritas', weight: 40, description: 'Menolak menandatangani berkas cacat' },
        { id: 'crit_adv_policy', title: 'Justifikasi Regulasi', weight: 20, description: 'Mengacu klausul resmi' },
      ],
      passingScore: 85,
    },
  ];

  const blueprint = {
    workspace: {
      name: wsName,
      slug,
      description: `Domain kurikulum operasional yang disintesis secara otonom dari ${parsedDocs.length} dokumen regulasi.`,
      icon: '🏛️',
    },
    sources,
    competencies,
    prerequisiteEdges,
    gates,
    tasks,
  };

  return {
    blueprint,
    dagIsAcyclic: acyclicCheck.isAcyclic,
    statistics: {
      sourcesCount: sources.length,
      chunksCount: parsedDocs.reduce((acc, d) => acc + d.chunks.length, 0),
      competenciesCount: competencies.length,
      edgesCount: prerequisiteEdges.length,
      gatesCount: gates.length,
      tasksCount: tasks.length,
    },
  };
}
