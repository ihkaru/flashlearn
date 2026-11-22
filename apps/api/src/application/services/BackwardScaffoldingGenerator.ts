import type { CognitiveArchetype, CompetencyNode } from '@flashlearn/shared';
import type { TaskEntity } from '../../domain/entities/Task';

export interface ScaffoldingBundle {
  jobAid: {
    checklist?: string[];
    formulas?: Record<string, string>;
    statutoryCitations?: string[];
  };
  workedExamples: Array<{
    id: string;
    title: string;
    scenario: string;
    solutionSteps: Array<{ step: string; explanation: string; commonTrap?: string }>;
    finalOutcome: string;
  }>;
  microSandbox?: {
    title: string;
    scenario: string;
    checkpoints: Array<{ label: string; hint: string }>;
  };
}

export class BackwardScaffoldingGenerator {
  generate(
    competency: CompetencyNode,
    tasks: TaskEntity[],
    statutoryCitations: string[] = []
  ): ScaffoldingBundle {
    const archetype: CognitiveArchetype =
      competency.cognitiveArchetype || this.inferArchetype(tasks[0]);

    const primaryTask = tasks[0];

    const jobAid = this.deriveJobAid(primaryTask, statutoryCitations, archetype);
    const workedExamples = this.deriveWorkedExamples(primaryTask, competency, archetype);
    const microSandbox = this.deriveMicroSandbox(primaryTask, competency, archetype);

    return {
      jobAid,
      workedExamples,
      microSandbox,
    };
  }

  private inferArchetype(task?: TaskEntity): CognitiveArchetype {
    if (!task) return 'artifact_audit';
    if (task.taskType === 'calculation' || task.oracleData?.formula) {
      return 'algorithmic_quant';
    }
    if (task.taskType === 'adversarial_dilemma' || task.adversarialSpec) {
      return 'ill_structured_case';
    }
    return 'artifact_audit';
  }

  private deriveJobAid(
    task?: TaskEntity,
    statutoryCitations: string[] = [],
    archetype?: CognitiveArchetype
  ): ScaffoldingBundle['jobAid'] {
    const checklist: string[] = [];
    const formulas: Record<string, string> = {};
    const citations: string[] = [...statutoryCitations];

    if (!task) {
      return {
        checklist: [
          'Tinjau seluruh dokumen acuan dan batas kewenangan standar',
          'Verifikasi kesesuaian langkah kerja terhadap Corpus of Record',
        ],
        statutoryCitations: citations.length > 0 ? citations : undefined,
      };
    }

    if (Array.isArray(task.oracleData?.mandatory_citations)) {
      for (const cit of task.oracleData.mandatory_citations) {
        if (!citations.includes(cit)) citations.push(cit);
      }
    }

    if (archetype === 'algorithmic_quant') {
      formulas['Formula Inti'] = task.oracleData?.formula
        ? String(task.oracleData.formula)
        : 'Output = f(Input Variabel Utama, Faktor Koreksi)';
      formulas['Invarian Toleransi'] = 'Margin deviasi maksimal ±1% dari nilai baku Oracle';

      if (Array.isArray(task.oracleData?.checklist) && task.oracleData.checklist.length > 0) {
        checklist.push(...task.oracleData.checklist.slice(0, 6));
      } else {
        checklist.push('Identifikasi seluruh variabel input kuantitatif dan satuannya dari skenario');
        checklist.push('Substitusikan variabel ke Formula Inti sesuai urutan operasi matematis');
        checklist.push('Periksa faktor pengurang, pembatas maksimum, atau pajak/margin bila relevan');
        checklist.push('Validasi hasil akhir berada dalam toleransi ±1% sebelum pengiriman');
      }
    } else if (archetype === 'ill_structured_case') {
      checklist.push('Identifikasi benturan kepentingan (Conflict of Interest), omisi data, atau tekanan tidak sah');
      checklist.push('Rujuk klausul kepatuhan mutlak dan batasan wewenang pada Corpus of Record');
      checklist.push('Bedakan tekanan situasional/jadwal dari syarat hukum atau keselamatan yang tidak dapat ditawar');
      checklist.push('Tetapkan disposisi tegas (tolak/tunda/eskalasi tertulis) tanpa kompromi diam-diam');
    } else {
      if (Array.isArray(task.oracleData?.checklist) && task.oracleData.checklist.length > 0) {
        checklist.push(...task.oracleData.checklist.slice(0, 6));
      } else {
        checklist.push('Verifikasi keabsahan, masa berlaku, dan kelengkapan setiap artefak utama');
        checklist.push('Uji kesesuaian terhadap kriteria wajib yang tercantum dalam standar acuan');
        checklist.push('Catat setiap anomali atau penyimpangan disertai bukti dan rujukan klausul');
      }
    }

    return {
      checklist,
      formulas: Object.keys(formulas).length > 0 ? formulas : undefined,
      statutoryCitations: citations.length > 0 ? citations : undefined,
    };
  }

  private buildScaledVariables(variables?: Record<string, any>): Array<[string, number]> {
    if (!variables || typeof variables !== 'object') return [];
    const entries: Array<[string, number]> = [];
    for (const [k, v] of Object.entries(variables)) {
      if (typeof v === 'number' && !/^(expected|target|excess)/i.test(k)) {
        // Scale by 0.5 (rounded cleanly) to construct a distinct isomorphic instance
        const scaled = v >= 10 ? Math.round(v * 0.5) : Number((v * 0.5).toFixed(2));
        entries.push([k, scaled]);
      }
    }
    return entries;
  }

  private deriveWorkedExamples(
    task: TaskEntity | undefined,
    competency: CompetencyNode,
    archetype: CognitiveArchetype
  ): ScaffoldingBundle['workedExamples'] {
    if (!task) {
      return [
        {
          id: 'we-default-01',
          title: `Contoh Pengerjaan Standar: ${competency.title}`,
          scenario: `Skenario acuan untuk memahami alur kerja operasional kompetensi ${competency.code}.`,
          solutionSteps: [
            { step: 'Langkah 1: Identifikasi Parameter', explanation: 'Pahami data masukan, standar rujukan, dan batasan kewenangan.' },
            { step: 'Langkah 2: Eksekusi Terverifikasi', explanation: 'Terapkan kaidah atau formula baku lalu periksa ulang konsistensi hasil.' },
          ],
          finalOutcome: 'Memenuhi seluruh kriteria kelulusan operasional.',
        },
      ];
    }

    if (archetype === 'algorithmic_quant') {
      const formula = String(task.oracleData?.formula || 'Output = f(input)');
      const scaledVars = this.buildScaledVariables(task.oracleData?.variables);
      const varSummary =
        scaledVars.length > 0
          ? scaledVars.map(([k, v]) => `${k} = ${v}`).join(', ')
          : 'parameter input terukur pada skala uji independen';

      return [
        {
          id: `we-${task.id}-quant`,
          title: `Bedah Kasus Ahli Isomorfik: ${competency.title}`,
          scenario: `Contoh Kasus Isomorfik (${competency.code}): Diberikan sekumpulan parameter uji berskala berbeda (${varSummary}) dengan formula standar [${formula}]. Susun langkah kalkulasi bertahap dan verifikasi kepatuhan batas toleransi.`,
          solutionSteps: [
            {
              step: '1. Ekstraksi & Normalisasi Variabel',
              explanation: `Petakan setiap nilai terukur (${varSummary}) ke simbol formula [${formula}] dengan satuan yang konsisten.`,
              commonTrap: 'Mencampuradukkan satuan (misalnya persentase vs desimal atau periode tahunan vs bulanan).',
            },
            {
              step: '2. Evaluasi Sub-Komponen Formula',
              explanation: 'Hitung tiap sub-ekspresi secara terpisah sebelum digabungkan untuk memudahkan audit per langkah.',
              commonTrap: 'Melewati operasi perkalian multi-periode atau salah memberi tanda penjumlahan/pengurangan.',
            },
            {
              step: '3. Validasi Batas Kepatuhan & Toleransi (±1%)',
              explanation: 'Cocokkan nilai akhir terhadap ambang regulasi yang berlaku pada dokumen acuan.',
              commonTrap: 'Membulatkan angka terlalu dini di langkah antara sehingga hasil akhir menyimpang > 1%.',
            },
          ],
          finalOutcome: `Hasil terverifikasi mengikuti formula [${formula}] dengan deviasi ≤ ±1%.`,
        },
      ];
    }

    if (archetype === 'ill_structured_case') {
      const policy =
        task.adversarialSpec?.statutoryPolicy ||
        (Array.isArray(task.oracleData?.mandatory_citations)
          ? task.oracleData.mandatory_citations.join(', ')
          : 'Kebijakan Kepatuhan Standar Domain');
      const disposition = task.adversarialSpec?.correctDisposition || 'REJECT_AND_DEMAND_DATA';

      return [
        {
          id: `we-${task.id}-case`,
          title: `Bedah Kasus Kontras: Integritas vs Kompromi (${competency.title})`,
          scenario: `Kasus Isomorfik (${competency.code}): Pemangku kepentingan mendesak persetujuan cepat sambil meminta pelonggaran syarat verifikasi wajib yang diatur dalam ${policy}.`,
          solutionSteps: [
            {
              step: 'Analisis Pendekatan Fatal (Gagal)',
              explanation:
                'Memberikan persetujuan bersyarat atau dispensasi lisan demi meredakan tekanan jadwal tanpa bukti verifikasi lengkap. Akibatnya batas kontrol dilanggar dan memicu diskualifikasi otomatis.',
              commonTrap: 'Mengorbankan syarat kepatuhan mutlak atas nama urgensi atau tekanan otoritas.',
            },
            {
              step: 'Analisis Pendekatan Ahli (Sesuai Standar)',
              explanation: `Menjalankan disposisi ${disposition}: menahan persetujuan, mendokumentasikan kekurangan bukti secara objektif, dan merujuk tegas pada ${policy}.`,
              commonTrap: 'Menyadari kejanggalan namun tetap meloloskan dengan catatan informal.',
            },
          ],
          finalOutcome: `Disposisi Patuh: ${disposition} berdasarkan ${policy}.`,
        },
      ];
    }

    const rubricHints = (task.rubricCriteria || [])
      .slice(0, 3)
      .map((r: any) => r.title || r.name)
      .filter(Boolean);

    return [
      {
        id: `we-${task.id}-audit`,
        title: `Bedah Artefak Ahli: ${competency.title}`,
        scenario: `Contoh Audit Isomorfik (${competency.code}): Lakukan penelaahan sistematis terhadap berkas/artefak uji untuk mendeteksi ketidaksesuaian terhadap standar operasional.`,
        solutionSteps: [
          {
            step: '1. Pemeriksaan Kelengkapan & Keabsahan Syarat Mutlak',
            explanation:
              rubricHints[0]
                ? `Fokus audit utama: ${rubricHints[0]}. Pastikan bukti objektif tersedia dan masih berlaku.`
                : 'Periksa validitas, otorisasi, dan masa berlaku setiap bukti pendukung.',
            commonTrap: 'Menerima klaim lisan atau surat komitmen informal sebagai pengganti bukti sah.',
          },
          {
            step: '2. Pencocokan Terhadap Klausul Acuan',
            explanation:
              rubricHints[1]
                ? `Validasi kriteria kedua: ${rubricHints[1]} dengan mencantumkan pasal/bab rujukan yang tepat.`
                : 'Hubungkan setiap temuan anomali langsung ke pasal atau ketentuan standar yang dilanggar.',
            commonTrap: 'Menulis kesimpulan umum tanpa merujuk ketentuan spesifik dari Corpus of Record.',
          },
          {
            step: '3. Penetapan Rekomendasi Tindakan Korektif',
            explanation: 'Nyatakan verdict secara tegas (lolos/gugur/revisi) beserta mitigasi risiko yang terukur.',
          },
        ],
        finalOutcome: `Rekomendasi terverifikasi selaras dengan rubrik ${competency.code}.`,
      },
    ];
  }

  private deriveMicroSandbox(
    task: TaskEntity | undefined,
    competency: CompetencyNode,
    archetype: CognitiveArchetype
  ): ScaffoldingBundle['microSandbox'] {
    if (!task) return undefined;

    if (archetype === 'algorithmic_quant') {
      const formula = String(task.oracleData?.formula || 'Output = f(input)');
      return {
        title: `Micro-Sandbox: Latihan Bertahap (${competency.code})`,
        scenario: `Latihan bebas penalti: Uji pemahaman alur perhitungan untuk formula [${formula}] sebelum masuk ke Ujian Pembuktian resmi.`,
        checkpoints: [
          { label: 'Langkah A: Susun seluruh variabel input', hint: `Pastikan semua simbol pada formula (${formula}) telah diisi angka dengan satuan seragam.` },
          { label: 'Langkah B: Cek arah operasi dan batas toleransi', hint: 'Pastikan faktor pengurang tidak dijumlahkan dan hasil akhir presisi dalam ±1%.' },
        ],
      };
    }

    if (archetype === 'ill_structured_case') {
      const policy = task.adversarialSpec?.statutoryPolicy || 'Standar Kepatuhan Resmi';
      return {
        title: `Micro-Sandbox: Refleksi Pertahanan Batas (${competency.code})`,
        scenario: `Latihan reflektif: Saat menghadapi desakan mempercepat keputusan dengan data belum lengkap, bagaimana urutan sikap Anda berdasarkan ${policy}?`,
        checkpoints: [
          { label: 'Deteksi Jebakan / Tekanan', hint: 'Identifikasi secara eksplisit bukti apa yang hilang dan jenis tekanan yang diberikan.' },
          { label: 'Tetapkan Disposisi Tegas', hint: `Tolak kompromi informal dan dokumentasikan dasar penolakan sesuai ${policy}.` },
        ],
      };
    }

    const firstCheck = Array.isArray(task.oracleData?.checklist) && task.oracleData.checklist[0]
      ? String(task.oracleData.checklist[0])
      : 'Cocokkan setiap item bukti terhadap standar wajib Corpus of Record';

    return {
      title: `Micro-Sandbox: Uji Cepat Ketelitian Audit (${competency.code})`,
      scenario: `Latihan bebas penalti untuk kompetensi ${competency.title}: periksa struktur kriteria sebelum menghadapi kasus ujian resmi.`,
      checkpoints: [
        { label: 'Verifikasi Kriteria Utama', hint: firstCheck },
        { label: 'Ground Verdict pada Corpus', hint: 'Sertakan alasan objektif dan kode rujukan standar untuk setiap temuan cacat.' },
      ],
    };
  }
}
