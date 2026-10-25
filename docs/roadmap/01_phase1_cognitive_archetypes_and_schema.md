# Fase 1: Skema Database & Kontrak Data Polimorfik
> **Bagian dari [Roadmap Arsitektur Kognitif FlashLearn v2.0](00_overview.md)**  
> *Target: Backend Core, Database Schema, Shared Types, dan Validasi Blueprint*

---

## 1. Tujuan Fase
1. Membakukan atribut `cognitive_archetype` di tingkat tabel `competencies` sebagai enum yang sepenuhnya *domain-agnostic*.
2. Mengikat materi instruksional (*learning materials*, *worked examples*, *checklists*) langsung di bawah jangkar Node Kompetensi DAG sebagai *Single Unit of Learning*.
3. Memperbarui validator Domain Blueprint agar menolak blueprint yang tidak memiliki arketipe kognitif yang valid.

---

## 2. Rincian Teknis & Arsitektur

### A. Skema Database Drizzle (`competencies.ts`)
Tambahkan enum PostgreSQL dan kolom pada tabel `competencies`:
```typescript
export const cognitiveArchetypeEnum = pgEnum('cognitive_archetype', [
  'algorithmic_quant',
  'artifact_audit',
  'ill_structured_case',
  'rapid_fluency',
]);

// Di dalam tabel competencies:
cognitiveArchetype: text('cognitive_archetype', {
  enum: ['algorithmic_quant', 'artifact_audit', 'ill_structured_case', 'rapid_fluency'],
}).default('ill_structured_case').notNull(),
```

### B. Relasi Kontrak Pembelajaran Tunggal (*Learning Container Binding*)
* Hubungkan tabel `contents` ke `competencies` secara deterministik.
* Setiap Node DAG dapat memiliki:
  - 1 Modul Teori Kontekstual & Job Aid
  - 1 *Annotated Worked Example* (Kasus Terbedah)
  - 1 *Micro-Sandbox* (Soal Latihan Terbuka Bebas Penalti)
* Buat tabel migrasi:
  `apps/api/drizzle/0008_cognitive_archetypes_and_learning_containers.sql`

### C. Pembaruan Shared Types & Validator
* Di `packages/shared/src/types/competency.ts`:
  ```typescript
  export type CognitiveArchetype =
    | 'algorithmic_quant'
    | 'artifact_audit'
    | 'ill_structured_case'
    | 'rapid_fluency';
  ```
* Di `packages/shared/src/utils/blueprint-validator.ts`:
  * Validasi bahwa setiap item dalam `competencies` memiliki `cognitiveArchetype` yang sah.
  * Validasi bahwa task yang dilampirkan kompatibel dengan arketipe kompetensinya:
    - `algorithmic_quant` $\to$ task type `calculation`.
    - `artifact_audit` $\to$ task type `checklist` atau `case_study` dengan rubrik anomali.
    - `ill_structured_case` $\to$ task type `adversarial_dilemma` atau `case_study`.
    - `rapid_fluency` $\to$ memiliki kartu kuis/flashcard terikat.

---

## 3. Kriteria Keberhasilan (Acceptance Criteria)

- [ ] Kolom `cognitive_archetype` terpasang di PostgreSQL dengan migrasi idempotent.
- [ ] Endpoint `GET /api/v1/workspaces/:wsId/competencies` mengembalikan atribut `cognitiveArchetype` untuk setiap node.
- [ ] Endpoint baru atau payload gabungan `GET /api/v1/competencies/:id/learning-bundle` menyajikan materi belajar, worked example, dan task dalam 1 panggilan tunggal.
- [ ] `bun test packages/` lulus 100% tanpa regresi.
- [ ] SRP File Limit $< 400$ baris per file tetap terjaga di seluruh repository.
