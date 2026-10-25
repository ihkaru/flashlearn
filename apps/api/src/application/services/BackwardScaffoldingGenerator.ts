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
        checklist: ['Baca seluruh dokumen persyaratan', 'Verifikasi kesesuaian SOP'],
        statutoryCitations: citations,
      };
    }

    if (task.oracleData?.mandatory_citations) {
      for (const cit of task.oracleData.mandatory_citations) {
        if (!citations.includes(cit)) citations.push(cit);
      }
    }

    if (archetype === 'algorithmic_quant') {
      if (task.oracleData?.formula) {
        formulas['Formula Inti'] = String(task.oracleData.formula);
      } else {
        formulas['Perhitungan Dasar'] = 'Biaya Pokok + Biaya Operasional - Nilai Sisa';
      }
      formulas['Invarian Toleransi'] = 'Margin kesalahan maksimal ±1% dari nilai baku';

      checklist.push('Identifikasi seluruh variabel belanja pokok (Capex / Pokok Beli)');
      checklist.push('Hitung akumulasi biaya operasional / SLA sepanjang siklus kontrak');
      checklist.push('Kurangkan estimasi nilai sisa (residual value) jika ada');
      checklist.push('Tambahkan komponen perpajakan / PPN sesuai ketentuan berlaku');
    } else if (archetype === 'ill_structured_case') {
      checklist.push('Identifikasi benturan kepentingan (Conflict of Interest) atau red flags');
      checklist.push('Rujuk klausul integritas dan batasan wewenang pejabat berwenang');
      checklist.push('Bedakan tekanan situasional dari kewajiban kepatuhan hukum mutlak');
      checklist.push('Ambil putusan tegas: Diskualifikasi / Penolakan jika syarat mutlak dilanggar');
    } else {
      // artifact_audit & general
      if (Array.isArray(task.oracleData?.checklist)) {
        checklist.push(...task.oracleData.checklist.slice(0, 5));
      } else {
        checklist.push('Verifikasi keabsahan legalitas dan masa berlaku dokumen');
        checklist.push('Cek kesesuaian spesifikasi terhadap kriteria acuan');
        checklist.push('Periksa tanda tangan pihak independen yang berwenang');
      }
    }

    return {
      checklist,
      formulas: Object.keys(formulas).length > 0 ? formulas : undefined,
      statutoryCitations: citations.length > 0 ? citations : undefined,
    };
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
          scenario: 'Skenario acuan untuk memahami struktur pemecahan masalah.',
          solutionSteps: [
            { step: 'Langkah 1: Identifikasi Masalah', explanation: 'Pahami parameter dan tujuan tugas.' },
            { step: 'Langkah 2: Eksekusi Prosedur', explanation: 'Gunakan checklist atau rumus yang berlaku.' },
          ],
          finalOutcome: 'Memenuhi seluruh kriteria kelulusan.',
        },
      ];
    }

    if (archetype === 'algorithmic_quant') {
      return [
        {
          id: `we-${task.id}-quant`,
          title: `Bedah Kasus Ahli: Perhitungan Isomorfik TCO Analitis`,
          scenario:
            'Contoh Kasus Mandiri: Pengadaan server database sekunder dengan harga pokok Rp 400.000.000, biaya implementasi Rp 60.000.000, SLA pemeliharaan Rp 30.000.000/tahun selama 3 tahun, dan nilai sisa tahun ke-3 sebesar Rp 50.000.000. Tentukan TCO sebelum pajak, PPN 11%, dan TCO Final.',
          solutionSteps: [
            {
              step: '1. Agregasi Biaya Pokok & Implementasi',
              explanation: 'Rp 400.000.000 + Rp 60.000.000 = Rp 460.000.000.',
              commonTrap: 'Mengabaikan biaya instalasi awal dari perhitungan belanja modal.',
            },
            {
              step: '2. Akumulasi Biaya SLA Sepanjang Kontrak',
              explanation: 'Rp 30.000.000/thn × 3 tahun = Rp 90.000.000.',
              commonTrap: 'Hanya memasukkan biaya SLA 1 tahun dan lupa mengalikan dengan durasi kontrak.',
            },
            {
              step: '3. Pengurangan Nilai Sisa (Residual Value)',
              explanation: 'Total TCO Pokok = Rp 460.000.000 + Rp 90.000.000 - Rp 50.000.000 = Rp 500.000.000.',
              commonTrap: 'Menjumlahkan nilai sisa alih-alih mengurangkannya dari total biaya kepemilikan.',
            },
            {
              step: '4. Perhitungan PPN 11% & Angka Final',
              explanation: 'PPN 11% = Rp 55.000.000. TCO Final = Rp 500.000.000 + Rp 55.000.000 = Rp 555.000.000.',
              commonTrap: 'Menghitung PPN sebelum mengurangi nilai sisa, mengakibatkan penggelembungan pajak.',
            },
          ],
          finalOutcome: 'TCO Pokok Rp 500.000.000, PPN Rp 55.000.000, Total TCO Final Rp 555.000.000.',
        },
      ];
    }

    if (archetype === 'ill_structured_case') {
      return [
        {
          id: `we-${task.id}-case`,
          title: 'Bedah Kasus Kontras: Penegakan Integritas vs Jebakan Pembenaran',
          scenario:
            'Contoh Perbandingan Kasus: Vendor menawarkan percepatan pengiriman jika administrasi tanda tangan BAST disederhanakan tanpa inspeksi gudang. Direksi cabang mendesak agar proyek segera tutup buku.',
          solutionSteps: [
            {
              step: 'Analisis Pendekatan Fatal (Gagal)',
              explanation:
                'Menyetujui BAST demi mengejar target penyerapan anggaran dengan asumsi barang akan datang sesuai spesifikasi. Hasil: Pelanggaran Pasal Three-Way Matching dan potensi tindak pidana fraud.',
              commonTrap: 'Mengorbankan kontrol internal atas nama efisiensi atau tekanan atasan.',
            },
            {
              step: 'Analisis Pendekatan Ahli (SOP)',
              explanation:
                'Menolak menandatangani BAST sebelum verifikasi fisik independen oleh tim penerima barang. Menerbitkan nota penolakan tertulis yang merujuk klausul SOP.',
              commonTrap: 'Ragu menolak karena khawatir menghambat serapan anggaran organisasi.',
            },
          ],
          finalOutcome: 'Keputusan: Penolakan Pembayaran / BAST Tidak Sah sampai verifikasi fisik selesai.',
        },
      ];
    }

    // Default: artifact_audit
    return [
      {
        id: `we-${task.id}-audit`,
        title: `Bedah Dokumen Contoh: Deteksi Anomali & Klasifikasi Kritis`,
        scenario:
          'Contoh Audit Berkas: Telaah berkas tender rekanan dengan sertifikat kualifikasi teknis yang masa berlakunya berakhir 3 hari sebelum pemasukan dokumen penawaran.',
        solutionSteps: [
          {
            step: '1. Validasi Batas Waktu Legalitas',
            explanation:
              'Periksa tanggal kadaluarsa sertifikat terhadap tanggal resmi pembukaan penawaran.',
            commonTrap: 'Hanya melihat lampiran nomor sertifikat tanpa menghitung tanggal jatuh tempo.',
          },
          {
            step: '2. Pengujian Dokumen Pengganti',
            explanation:
              'Surat permohonan perpanjangan ke asosiasi tidak memiliki kekuatan hukum menggantikan sertifikat aktif.',
            commonTrap: 'Menerima surat keterangan proses perpanjangan sebagai dispensasi.',
          },
          {
            step: '3. Penentuan Rekomendasi Yuridis',
            explanation:
              'Rekomendasi mutlak: DISKUALIFIKASI / GUGUR sesuai ketentuan dokumen pengadaan.',
          },
        ],
        finalOutcome: 'Status: Diskualifikasi / Gugur pada tahap evaluasi kualifikasi.',
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
      return {
        title: 'Micro-Sandbox: Latihan Mandiri Perhitungan Ringkas',
        scenario:
          'Simulasi Bebas Penalti: Anda memiliki pengadaan senilai Rp 200.000.000, implementasi Rp 20.000.000, SLA Rp 15.000.000/thn selama 2 tahun, dan nilai sisa Rp 10.000.000. Berapakah TCO Pokok sebelum pajak?',
        checkpoints: [
          { label: 'Langkah A: Hitung Total Pengeluaran Kotor', hint: 'Rp 200 Jt + Rp 20 Jt + (Rp 15 Jt × 2) = Rp 250 Jt' },
          { label: 'Langkah B: Kurangkan Nilai Sisa', hint: 'Rp 250 Jt - Rp 10 Jt = Rp 240 Jt' },
          { label: 'Cek Mandiri', hint: 'Jawaban tepat adalah Rp 240.000.000.' },
        ],
      };
    }

    if (archetype === 'ill_structured_case') {
      return {
        title: 'Micro-Sandbox: Refleksi Pengambilan Keputusan',
        scenario:
          'Simulasi Reflektif: Jika atasan langsung Anda meminta dispensasi kelulusan vendor kerabat dengan alasan vendor tersebut sudah berpengalaman 10 tahun, apa langkah pertama yang Anda ambil?',
        checkpoints: [
          { label: 'Identifikasi Pelanggaran', hint: 'Benturan kepentingan (Conflict of Interest) & prinsip nondiskriminasi.' },
          { label: 'Langkah Mitigasi', hint: 'Menyampaikan nota kepatuhan tertulis dan menolak dispensasi tanpa dasar hukum.' },
        ],
      };
    }

    return {
      title: 'Micro-Sandbox: Uji Cepat Ketelitian Dokumen',
      scenario:
        'Coba telaah: Jika terdapat perbedaan nilai antara Surat Penawaran (Rp 150.000.000) dan Rincian Biaya Lampiran (Rp 155.000.000), nilai manakah yang dijadikan acuan klarifikasi?',
      checkpoints: [
        { label: 'Pemeriksaan Aritmatika', hint: 'Lakukan koreksi aritmatika atas volume dikalikan harga satuan.' },
        { label: 'Acuan Hukum', hint: 'SOP mengatur klarifikasi ke rincian satuan terkoreksi tanpa mengubah harga total.' },
      ],
    };
  }
}
