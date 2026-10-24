#!/usr/bin/env bun
/**
 * FlashLearn Autonomous Domain Synthesizer Script
 * Agent-Agnostic Engine that ingests Markdown regulations/SOPs,
 * validates DAG acyclicity via Tarjan's SCC, and generates a complete DomainBlueprint.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename } from 'node:path';

interface ChunkMeta {
  locationTag: string;
  content: string;
  sha256: string;
}

interface ParsedDoc {
  fileName: string;
  sourceCode: string;
  title: string;
  chunks: ChunkMeta[];
}

// 1. Tarjan's SCC Acyclicity Checker
function verifyAcyclicity(nodes: string[], edges: Array<{ from: string; to: string }>): { isAcyclic: boolean; cycles: string[][] } {
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

// 2. Markdown Parser & Chunk Extractor
function parseMarkdownDocument(filePath: string, index: number): ParsedDoc {
  if (!existsSync(filePath)) {
    throw new Error(`Markdown file not found: ${filePath}`);
  }
  const raw = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n').trim();
  const fileName = basename(filePath);
  const baseCode = fileName.replace(/\.[^/.]+$/, '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 10);
  const sourceCode = `SRC-${baseCode || `DOC${index + 1}`}`;

  // Extract first H1 as document title
  const h1Match = raw.match(/^#\s+(.+)$/m);
  const title = h1Match ? h1Match[1].trim() : fileName.replace(/\.md$/i, '');

  // Split into addressable sections
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

// 3. Main Synthesizer
async function main() {
  const args = process.argv.slice(2);
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) {
        flags[k] = v;
      } else if (args[i + 1] && !args[i + 1].startsWith('--')) {
        flags[k] = args[i + 1];
        i++;
      } else {
        flags[k] = true;
      }
    }
  }

  const wsName = (flags['workspace-name'] as string) || (flags['name'] as string);
  const srcFilesStr = (flags['source-files'] as string) || (flags['sources'] as string) || (flags['file'] as string);
  const isDryRun = !!flags['dry-run'];
  const outputFile = flags['output'] as string;
  const apiUrl = (flags['api-url'] as string) || 'http://localhost:3000';

  if (!wsName || !srcFilesStr) {
    console.error(JSON.stringify({
      schemaVersion: '1.0.0',
      status: 'error',
      code: 'MISSING_ARGUMENT',
      message: 'Usage: bun synthesize_domain.ts --workspace-name "<NAME>" --source-files "<file1.md,file2.md>" [--dry-run] [--output <path>]',
    }, null, 2));
    process.exit(64);
  }

  const filePaths = srcFilesStr.split(',').map((f) => f.trim()).filter((f) => f.length > 0);
  const parsedDocs = filePaths.map((f, idx) => parseMarkdownDocument(f, idx));

  const slug = (flags['slug'] as string) || wsName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Build 3-Tier Bloom DAG
  const sourcesPayload = parsedDocs.map((doc) => ({
    code: doc.sourceCode,
    title: doc.title,
    version: '1.0.0',
    owner: 'Regulator & Standard Authority',
    effectiveDate: new Date().toISOString(),
    chunks: doc.chunks.map((c) => ({ locationTag: c.locationTag, content: c.content })),
  }));

  const comp1Code = `${slug.toUpperCase().slice(0, 4)}-FOUND-01`;
  const comp2Code = `${slug.toUpperCase().slice(0, 4)}-APPLY-02`;
  const comp3Code = `${slug.toUpperCase().slice(0, 4)}-STRESS-03`;

  const primaryChunk = parsedDocs[0]?.chunks[0]?.content.slice(0, 160) || 'Standar operasional dan regulasi.';

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
      title: `Analisis Studi Kasus & Evaluasi Mitigasi ${wsName}`,
      description: `Analisis trade-off dan penghindaran jebakan (negative anchors) dalam skenario operasional.`,
      oracleClass: 'B' as const,
      riskLevel: 'medium' as const,
      cognitiveTier: 'analyze',
    },
    {
      code: comp3Code,
      title: `Pertahanan Integritas & Uji Stres Adversarial ${wsName}`,
      description: `Pengujian pertahanan batas operasional di bawah tekanan urgensi, omisi data, dan dilema etika.`,
      oracleClass: 'B' as const,
      riskLevel: 'critical' as const,
      cognitiveTier: 'evaluate',
    },
  ];

  const prerequisiteEdges = [
    { sourceCompetencyCode: comp1Code, targetCompetencyCode: comp2Code },
    { sourceCompetencyCode: comp2Code, targetCompetencyCode: comp3Code },
  ];

  // Verify DAG Acyclicity
  const acyclicCheck = verifyAcyclicity(
    competencies.map((c) => c.code),
    prerequisiteEdges.map((e) => ({ from: e.sourceCompetencyCode, to: e.targetCompetencyCode }))
  );

  if (!acyclicCheck.isAcyclic) {
    console.error(JSON.stringify({
      schemaVersion: '1.0.0',
      status: 'error',
      code: 'CYCLIC_DEPENDENCY_DETECTED',
      message: 'Generated prerequisite graph contains circular dependencies',
      cycles: acyclicCheck.cycles,
    }, null, 2));
    process.exit(1);
  }

  const gates = [
    {
      name: `Level 1: Izin Observasi & Kalkulasi Dasar (${wsName})`,
      level: 1,
      description: `Memverifikasi penguasaan formula matematis dan checklist regulasi.`,
      requiredCompetencyCodes: [comp1Code],
    },
    {
      name: `Level 2: Praktisi Operasional Mandiri (${wsName})`,
      level: 2,
      description: `Memverifikasi kemampuan pengambilan keputusan studi kasus dan mitigasi risiko.`,
      requiredCompetencyCodes: [comp1Code, comp2Code],
    },
    {
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
    sources: sourcesPayload,
    competencies,
    prerequisiteEdges,
    gates,
    tasks,
  };

  if (outputFile) {
    writeFileSync(outputFile, JSON.stringify(blueprint, null, 2), 'utf-8');
  }

  if (isDryRun) {
    console.log(JSON.stringify({
      schemaVersion: '1.0.0',
      status: 'success',
      command: 'flashlearn domain synthesize',
      data: {
        dryRun: true,
        workspaceName: wsName,
        sourcesCount: sourcesPayload.length,
        chunksCount: parsedDocs.reduce((acc, d) => acc + d.chunks.length, 0),
        competenciesCount: competencies.length,
        edgesCount: prerequisiteEdges.length,
        gatesCount: gates.length,
        tasksCount: tasks.length,
        dagIsAcyclic: acyclicCheck.isAcyclic,
        outputFile: outputFile || null,
      },
      nextActions: [
        {
          command: `flashlearn domain synthesize --workspace-name "${wsName}" --source-files "${srcFilesStr}"`,
          description: 'Persist domain blueprint into FlashLearn production engine',
        },
      ],
    }, null, 2));
    process.exit(0);
  }

  // Persist directly via FlashLearn API
  try {
    const res = await fetch(`${apiUrl}/api/v1/workspaces/blueprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprint }),
    });

    const resJson = await res.json();
    if (!res.ok) {
      throw new Error(resJson.error || `HTTP ${res.status}`);
    }

    // Trigger describe to verify readiness
    const descRes = await fetch(`${apiUrl}/api/v1/workspaces/${resJson.workspaceId}/describe`);
    const descJson = await descRes.json();

    console.log(JSON.stringify({
      schemaVersion: '1.0.0',
      status: 'success',
      command: 'flashlearn domain synthesize',
      data: {
        workspaceId: resJson.workspaceId,
        slug,
        readinessScore: descJson.readinessScore,
        cycleDetected: descJson.cycleDetected,
        gaps: descJson.gaps,
        topology: descJson.topology,
        statistics: descJson.statistics,
      },
      nextActions: [
        {
          command: `flashlearn domain describe ${resJson.workspaceId}`,
          description: 'Inspect live domain topology and readiness ledger',
        },
        {
          command: `flashlearn competency list --workspace ${resJson.workspaceId}`,
          description: 'Browse synthesized competency graph',
        },
      ],
    }, null, 2));
  } catch (err: any) {
    console.error(JSON.stringify({
      schemaVersion: '1.0.0',
      status: 'error',
      code: 'API_PERSISTENCE_FAILED',
      message: err.message,
    }, null, 2));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
