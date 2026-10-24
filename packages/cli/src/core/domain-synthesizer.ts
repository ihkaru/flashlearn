import { verifyAcyclicity, type AcyclicityResult } from './graph-validator';
import {
  parseMarkdownDocument,
  parseMarkdownText,
  extractDomainRules,
  type ParsedDoc,
  type ChunkMeta,
} from './markdown-parser';

export { verifyAcyclicity, parseMarkdownDocument, parseMarkdownText, extractDomainRules };
export type { ParsedDoc, ChunkMeta, AcyclicityResult };

export interface SynthesisOptions {
  workspaceName: string;
  sourceFiles?: string[];
  markdownTexts?: Array<{ fileName?: string; title?: string; text: string }>;
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

export function synthesizeDomainBlueprint(options: SynthesisOptions): SynthesisResult {
  const parsedDocs: ParsedDoc[] = [];
  if (options.sourceFiles) {
    options.sourceFiles.forEach((f, idx) => parsedDocs.push(parseMarkdownDocument(f, idx)));
  }
  if (options.markdownTexts) {
    options.markdownTexts.forEach((t, idx) =>
      parsedDocs.push(parseMarkdownText(t.text, t.title || t.fileName || `Doc-${idx + 1}`, parsedDocs.length))
    );
  }

  if (parsedDocs.length === 0) {
    throw new Error('INSUFFICIENT_DOMAIN_SPECIFICATION: No valid markdown sources provided for domain synthesis');
  }

  const totalChunks = parsedDocs.reduce((acc, d) => acc + d.chunks.length, 0);
  if (totalChunks < 2) {
    throw new Error(
      'INSUFFICIENT_DOMAIN_SPECIFICATION: Ingested document must contain at least 2 structured sections or paragraphs'
    );
  }

  const rules = extractDomainRules(parsedDocs);

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

  const prefix = (slug.replace(/[^a-z0-9]/gi, '').slice(0, 4) || 'DOMN').toUpperCase();
  const comp1Code = `${prefix}-FOUND-01`;
  const comp2Code = `${prefix}-APPLY-02`;
  const comp3Code = `${prefix}-STRESS-03`;

  const competencies = [
    {
      code: comp1Code,
      title: `Verifikasi Standar & Parameter Teknis (${wsName})`,
      description: `Kalkulasi parameter operasional dan verifikasi checklist berdasarkan ${parsedDocs[0].sourceCode}.`,
      oracleClass: 'A' as const,
      riskLevel: 'low' as const,
      cognitiveTier: 'remember',
    },
    {
      code: comp2Code,
      title: `Analisis Kasus & Penerapan Prosedur (${wsName})`,
      description: `Analisis trade-off, evaluasi mitigasi deviasi, dan penghindaran jebakan fatal dalam skenario operasional.`,
      oracleClass: 'B' as const,
      riskLevel: 'medium' as const,
      cognitiveTier: 'analyze',
    },
    {
      code: comp3Code,
      title: `Uji Integritas Batas & Penegakan Protokol (${wsName})`,
      description: `Pengujian pertahanan batas operasional di bawah tekanan urgensi, omisi data kritis, dan dilema etika.`,
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
      title: `Level 1: Otorisasi Observasi & Kalkulasi Dasar (${wsName})`,
      name: `Level 1: Otorisasi Observasi & Kalkulasi Dasar (${wsName})`,
      level: 1,
      description: `Memverifikasi penguasaan parameter teknis, formula, dan checklist regulasi.`,
      requiredCompetencyCodes: [comp1Code],
    },
    {
      title: `Level 2: Praktisi Operasional Terverifikasi (${wsName})`,
      name: `Level 2: Praktisi Operasional Terverifikasi (${wsName})`,
      level: 2,
      description: `Memverifikasi kemampuan evaluasi kasus nyata, mitigasi risiko deviasi, dan penerapan SOP.`,
      requiredCompetencyCodes: [comp1Code, comp2Code],
    },
    {
      title: `Level 3: Otoritas Independen & Pertahanan Integritas (${wsName})`,
      name: `Level 3: Otoritas Independen & Pertahanan Integritas (${wsName})`,
      level: 3,
      description: `Sertifikasi otoritas tinggi tahan jebakan operasional dan uji stres adversarial.`,
      requiredCompetencyCodes: [comp1Code, comp2Code, comp3Code],
    },
  ];

  // Dynamic Class A Task
  const primaryFormula = rules.numericalLimits[0];
  const expectedFormulas: Record<string, any> = {};
  if (primaryFormula) {
    expectedFormulas[primaryFormula.key] = { expectedValue: primaryFormula.value, tolerance: 0 };
  } else {
    expectedFormulas['skor_kepatuhan_minimum'] = { expectedValue: 100, tolerance: 0 };
  }

  const task1Checklist = rules.checklistItems.slice(0, 4);
  const task1Scenario = `Lakukan verifikasi pemenuhan parameter standar operasional berikut berdasarkan ${parsedDocs[0].sourceCode}: ${task1Checklist.slice(0, 2).join('; ')}`;

  // Dynamic Class B Task
  const ruleToEvaluate = rules.prohibitions[0] || rules.mandates[1] || rules.checklistItems[1] || 'Ketentuan standar operasional';
  const mandatoryAdherence = rules.mandates[0] || rules.checklistItems[0] || 'Prosedur operasional baku';

  // Dynamic Class C / Adversarial Task
  const criticalOmission = rules.dilemmaTriggers[0] || rules.mandates[0] || rules.checklistItems[0];

  const tasks = [
    {
      competencyCode: comp1Code,
      title: `Verifikasi Formula & Checklist Dokumen ${wsName}`,
      scenario: task1Scenario,
      taskType: 'calculation',
      oracleData: {
        expectedFormulas,
        checklist: task1Checklist,
      },
      rubricCriteria: [
        { id: 'crit_c1_calc', title: 'Akurasi Parameter', weight: 50, description: 'Kalkulasi nilai tepat tanpa deviasi' },
        { id: 'crit_c1_chk', title: 'Kelengkapan Checklist', weight: 50, description: 'Semua butir kepatuhan terpenuhi' },
      ],
      passingScore: 85,
    },
    {
      competencyCode: comp2Code,
      title: `Analisis Kasus & Mitigasi Risiko: ${wsName}`,
      scenario: `Tinjau skenario operasional lapangan terkait: '${ruleToEvaluate}'. Evaluasi potensi risiko deviasi dan tentukan tindakan korektif yang wajib diambil sesuai SOP.`,
      taskType: 'case_study',
      oracleData: {
        goldSolution: `Terapkan verifikasi ketat sesuai ketentuan resmi: '${mandatoryAdherence}', serta tolak toleransi tidak berizin.`,
        negativeAnchors: [
          {
            id: 'trap_rule_bypass',
            trapDescription: `Memberikan toleransi atau mengabaikan ketentuan: ${ruleToEvaluate.slice(0, 70)}`,
            penaltyPoints: 40,
            fatal: true,
          },
        ],
      },
      rubricCriteria: [
        { id: 'crit_c2_substance', title: 'Kesesuaian Prosedur', weight: 60, description: 'Langkah tepat mengacu dokumen rujukan' },
        { id: 'crit_c2_mitigation', title: 'Mitigasi Risiko', weight: 40, description: 'Mencegah potensi kegagalan operasional' },
      ],
      passingScore: 85,
    },
    {
      competencyCode: comp3Code,
      title: `Uji Stres Adversarial: Penegakan Integritas di Bawah Tekanan Desakan`,
      scenario: `Dalam situasi urgensi tinggi dan desakan penyelesaian segera dari pemangku kepentingan, ditemukan bahwa syarat kritis berikut belum terpenuhi atau diabaikan: '${criticalOmission}'. Tentukan disposisi resmi Anda.`,
      taskType: 'adversarial_dilemma',
      oracleData: {},
      adversarialSpec: {
        trapType: 'OMISSION_DATA',
        correctDisposition: 'REJECT_AND_DEMAND_DATA',
        trapCues: [
          { cue: `Omisi atau belum terverifikasinya syarat kritis: ${criticalOmission.slice(0, 90)}`, weight: 0.6 },
          { cue: 'Tekanan desakan waktu operasional dan permintaan percepatan sepihak', weight: 0.4 },
        ],
        statutoryPolicy: `${parsedDocs[0].sourceCode} - Ketentuan Integritas: ${criticalOmission.slice(0, 100)}`,
        vetoThreshold: 0.7,
      },
      rubricCriteria: [
        { id: 'crit_adv_vigilance', title: 'Kewaspadaan Omisi', weight: 40, description: 'Mendeteksi syarat kritis belum terpenuhi' },
        { id: 'crit_adv_defense', title: 'Pertahanan Batas Integritas', weight: 40, description: 'Menolak menandatangani berkas cacat' },
        { id: 'crit_adv_policy', title: 'Justifikasi Rujukan Regulasi', weight: 20, description: 'Mengacu klausul standar resmi' },
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
      chunksCount: totalChunks,
      competenciesCount: competencies.length,
      edgesCount: prerequisiteEdges.length,
      gatesCount: gates.length,
      tasksCount: tasks.length,
    },
  };
}
