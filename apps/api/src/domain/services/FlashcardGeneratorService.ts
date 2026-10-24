import type { TaskEntity } from '../entities/Task';
import type { PostTaskFlashcard, AttemptDetail } from '@flashlearn/shared';

export class FlashcardGeneratorService {
  generateFromAttempt(
    task: TaskEntity,
    breakdown: AttemptDetail[],
    discrepancies?: Array<{ field: string; expected: number; received: number }>,
    traps?: string[]
  ): PostTaskFlashcard[] {
    const cards: PostTaskFlashcard[] = [];

    // 1. Generate cards from calculation discrepancies
    if (discrepancies && discrepancies.length > 0) {
      for (const disc of discrepancies) {
        cards.push({
          front: `Berapa batas / nilai perhitungan yang benar untuk: "${disc.field}"?`,
          back: `Nilai yang benar adalah ${disc.expected}. (Catatan: input Anda adalah ${disc.received}).`,
          category: 'Kalkulasi & Formula',
          remedyHint: `Periksa kembali formula dasar pada modul ${task.title}.`,
        });
      }
    }

    // 2. Generate cards from detected fatal traps
    if (traps && traps.length > 0) {
      for (const trap of traps) {
        cards.push({
          front: `Mengapa tindakan berikut merupakan jebakan fatal dalam konteks "${task.title}"?\n"${trap}"`,
          back: `Tindakan tersebut melanggar prosedur standar atau kriteria kepatuhan dan dapat memicu kegagalan operasional/audit. Pastikan selalu mematuhi pedoman rujukan resmi sebelum mengambil tindakan.`,
          category: 'Mitigasi Risiko & Jebakan',
          remedyHint: 'Hindari asumsi sepihak tanpa dokumen rujukan atau justifikasi resmi.',
        });
      }
    }

    // 3. Generate cards from failed criteria
    const failedCriteria = breakdown.filter((b) => !b.passed);
    for (const fc of failedCriteria) {
      cards.push({
        front: `Poin Kritis: "${fc.criterionTitle}"`,
        back: `Penjelasan Evaluasi: ${fc.reason}`,
        category: 'Kriteria Kelulusan',
        remedyHint: 'Tinjau kembali bagian ini sebelum mengulang tugas.',
      });
    }

    // 4. Fallback if everything passed: generate reinforcement cards from key takeaways
    if (cards.length === 0) {
      const takeaways = task.oracleData.keyTakeaways || [task.title];
      for (const item of takeaways) {
        cards.push({
          front: `Konsep Kunci: ${task.title}`,
          back: item,
          category: 'Pemantapan Materi',
        });
      }
    }

    return cards;
  }
}
