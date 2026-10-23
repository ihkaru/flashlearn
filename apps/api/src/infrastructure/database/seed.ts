import { db } from './db';
import { users, workspaces, contents, apiKeys } from './schema';
import { createHash } from 'crypto';
import { seedProcurement } from './seeds/procurement.seed';

async function seed() {
  console.log('🌱 Starting FlashLearn Database Seeding...');

  // 1. Create or Find Superadmin & Creator Users
  const [admin] = await db
    .insert(users)
    .values({
      email: 'ihza2karunia@gmail.com',
      name: 'Super Admin FlashLearn',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=flashadmin',
      role: 'superadmin',
      googleId: 'google-seed-admin-01',
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { role: 'superadmin' },
    })
    .returning();

  const [creator] = await db
    .insert(users)
    .values({
      email: 'creator@flashlearn.dev',
      name: 'Budi Pembina (Creator)',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=budi',
      role: 'creator',
      googleId: 'google-seed-creator-01',
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { role: 'creator' },
    })
    .returning();

  console.log('✓ Users seeded:', admin.email, creator.email);

  // 2. Create Public Workspaces
  const [wsArch] = await db
    .insert(workspaces)
    .values({
      name: 'Software Engineering & Clean Architecture',
      slug: 'software-engineering-architecture',
      description: 'Mempelajari Hexagonal Architecture, Ports & Adapters, SOLID principles, dan domain-driven patterns.',
      icon: '🏛️',
      isPublic: true,
      creatorId: admin.id,
    })
    .onConflictDoNothing()
    .returning();

  const [wsTs] = await db
    .insert(workspaces)
    .values({
      name: 'TypeScript Mastery & Bun Runtime',
      slug: 'typescript-mastery-bun',
      description: 'Eksplorasi mendalam TypeScript 5.8+, Bun runtime native performance, dan modern tooling.',
      icon: '⚡',
      isPublic: true,
      creatorId: creator.id,
    })
    .onConflictDoNothing()
    .returning();

  const activeWsArch = wsArch || (await db.query.workspaces.findFirst({ where: (w, { eq }) => eq(w.slug, 'software-engineering-architecture') }));
  const activeWsTs = wsTs || (await db.query.workspaces.findFirst({ where: (w, { eq }) => eq(w.slug, 'typescript-mastery-bun') }));

  if (!activeWsArch || !activeWsTs) {
    throw new Error('Failed to resolve workspaces for seeding');
  }

  // 3. Create Sample Contents for the 3 Types:
  // Type 1: Materi Saja
  await db
    .insert(contents)
    .values({
      workspaceId: activeWsArch.id,
      title: 'Hexagonal Architecture: Ports & Adapters Explained',
      slug: 'hexagonal-architecture-ports-adapters',
      type: 'materi',
      summary: 'Panduan komprehensif memisahkan core business logic dari framework HTTP dan database.',
      readingTimeMinutes: 7,
      body: `## Mengapa Hexagonal Architecture?

Hexagonal Architecture (dikenal juga sebagai **Ports and Adapters Pattern**) diciptakan oleh Alistair Cockburn pada tahun 2005. Tujuannya adalah membuat aplikasi dapat dijalankan secara independen dari pengguna, program lain, basis data, atau lingkungan pengujian.

### Anatomi Arsitektur

1. **Domain Layer (Core Entities)**: Berisi model murni dan aturan bisnis domain. Tidak memiliki dependensi ke pustaka eksternal (zero dependency).
2. **Ports (Interfaces)**: Kontrak abstrak yang mendefinisikan apa yang dibutuhkan domain dari luar (Driven Port) atau apa yang disediakan domain untuk pemanggil (Driving Port).
3. **Adapters**: Implementasi konkret dari port.
   - *Driving Adapter*: Mengubah request HTTP / CLI menjadi eksekusi use case (misal: Elysia Route Controller).
   - *Driven Adapter*: Mengimplementasikan akses database (misal: Drizzle ORM Repository) atau layanan eksternal (misal: Google OAuth).

### Keuntungan Utama
- **Testability**: Sangat mudah melakukan unit test pada use case tanpa perlu menyalakan database atau HTTP server sungguhan.
- **Flexibility**: Mengganti Postgres ke SQLite atau MongoDB hanya memerlukan penulisan satu adapter baru, tanpa mengubah satu baris pun kode use case!`,
      questions: null,
      isPublished: true,
    })
    .onConflictDoNothing();

  // Type 2: Quiz Saja
  await db
    .insert(contents)
    .values({
      workspaceId: activeWsTs.id,
      title: 'Kuis Evaluasi TypeScript Advanced Types & Runes',
      slug: 'kuis-typescript-advanced-types',
      type: 'quiz',
      summary: 'Uji pemahamanmu tentang generics, conditional types, dan reactive state management.',
      readingTimeMinutes: 4,
      body: null,
      questions: [
        {
          id: 'q1',
          question: 'Apa fungsi utama dari conditional types dalam TypeScript (T extends U ? X : Y)?',
          options: [
            { id: 'opt1_1', text: 'Menjalankan logika percabangan if-else pada saat runtime JavaScript.' },
            { id: 'opt1_2', text: 'Memilih tipe data yang berbeda pada saat compile-time berdasarkan hubungan relasi antar tipe.', isCorrect: true },
            { id: 'opt1_3', text: 'Mengubah semua tipe menjadi any jika kondisi tidak terpenuhi.' },
            { id: 'opt1_4', text: 'Mencegah eksekusi fungsi jika argumen bernilai null.' },
          ],
          explanation: 'Conditional types mengevaluasi relasi tipe pada waktu kompilasi (compile-time) dan menghasilkan tipe data yang sesuai tanpa membebani runtime sama sekali.',
          difficulty: 'medium',
          hint: 'Ingat bahwa TypeScript adalah sistem tipe static compile-time.',
        },
        {
          id: 'q2',
          question: 'Di Svelte 5, rune apa yang digunakan untuk mendeklarasikan reactive state lokal?',
          options: [
            { id: 'opt2_1', text: '$state()', isCorrect: true },
            { id: 'opt2_2', text: '$reactive()' },
            { id: 'opt2_3', text: '$derived()' },
            { id: 'opt2_4', text: '$effect()' },
          ],
          explanation: 'Svelte 5 memperkenalkan Runes; $state() adalah rune resmi untuk membuat nilai primitif atau objek menjadi reactive state.',
          difficulty: 'easy',
          hint: 'Rune ini menggantikan sintaks lama let x = 123;.',
        },
        {
          id: 'q3',
          question: 'Mengapa Bun jauh lebih cepat dibandingkan runtime Node.js tradisional untuk I/O dan startup?',
          options: [
            { id: 'opt3_1', text: 'Karena Bun tidak menggunakan garbage collection.' },
            { id: 'opt3_2', text: 'Karena Bun dibangun dengan bahasa Zig dan menggunakan mesin JavaScriptCore (WebKit) yang dioptimasi untuk kecepatan I/O.', isCorrect: true },
            { id: 'opt3_3', text: 'Karena Bun mengabaikan semua aturan keamanan TLS.' },
            { id: 'opt3_4', text: 'Karena Bun mengonversi semua kode TypeScript menjadi WebAssembly.' },
          ],
          explanation: 'Bun dibangun dari nol menggunakan bahasa pemrograman Zig dan engine JavaScriptCore (Safari/WebKit), dengan syscall I/O yang sangat teroptimasi.',
          difficulty: 'medium',
          hint: 'Perhatikan bahasa pemrograman tingkat rendah dan engine JS yang digunakan Bun.',
        },
      ],
      isPublished: true,
    })
    .onConflictDoNothing();

  // Type 3: Materi & Quiz Digabung
  await db
    .insert(contents)
    .values({
      workspaceId: activeWsArch.id,
      title: 'Single Responsibility Principle (SRP): Teori & Uji Pemahaman',
      slug: 'single-responsibility-principle-module',
      type: 'combined',
      summary: 'Pelajari konsep SRP dari SOLID principles lengkap dengan materi bacaan dan kuis pengujian langsung.',
      readingTimeMinutes: 8,
      body: `## Prinsip Single Responsibility (SRP)

> *"A class should have one, and only one, reason to change."* — Robert C. Martin (Uncle Bob)

Banyak pengembang salah mengartikan SRP sebagai *"sebuah fungsi/kelas hanya boleh melakukan satu hal kecil"*. Pengertian yang lebih tepat menurut Uncle Bob adalah: **sebuah modul harus bertanggung jawab kepada satu, dan hanya satu, aktor / pemangku kepentingan (stakeholder)**.

### Contoh Pelanggaran SRP
Bayangkan kelas \`Employee\` yang memiliki metode:
1. \`calculatePay()\`: Dibutuhkan oleh departemen Akuntansi/Keuangan (CFO).
2. \`reportHours()\`: Dibutuhkan oleh departemen SDM / Operasional (COO).
3. \`save()\`: Dibutuhkan oleh Database Administrator (CTO).

Jika tim akuntansi meminta perubahan rumus jam lembur di \`calculatePay()\`, dan pengembang mengubah fungsi pembantu bersama yang juga digunakan oleh \`reportHours()\`, maka laporan departemen SDM bisa salah hitung!

### Solusi Terbaik
Pisahkan use case berdasarkan aktor:
- \`PayCalculator\` untuk Akuntansi.
- \`HourReporter\` untuk SDM.
- \`EmployeeRepository\` untuk Persistensi.`,
      questions: [
        {
          id: 'q_srp_1',
          question: 'Menurut definisi arsitektur perangkat lunak yang tepat, apa arti "alasan untuk berubah" dalam Single Responsibility Principle?',
          options: [
            { id: 'opt_srp_1', text: 'Jumlah baris kode dalam file tidak boleh lebih dari 100 baris.' },
            { id: 'opt_srp_2', text: 'Modul tersebut hanya boleh bertanggung jawab kepada satu aktor / peran pemangku kepentingan (stakeholder).', isCorrect: true },
            { id: 'opt_srp_3', text: 'Modul tidak boleh memiliki lebih dari satu fungsi public.' },
            { id: 'opt_srp_4', text: 'File kode tidak boleh diubah oleh lebih dari satu programmer di Git.' },
          ],
          explanation: 'SRP mendefinisikan tanggung jawab berdasarkan aktor/stakeholder yang meminta perubahan logika bisnis.',
          difficulty: 'medium',
        },
        {
          id: 'q_srp_2',
          question: 'Dalam Hexagonal Architecture, di mana letak Use Case yang menerapkan SRP?',
          options: [
            { id: 'opt_srp_2_1', text: 'Application Layer, di mana setiap class use-case mengurus satu operasi spesifik.', isCorrect: true },
            { id: 'opt_srp_2_2', text: 'Database Layer di dalam file SQL schema.' },
            { id: 'opt_srp_2_3', text: 'Di dalam CSS template visual.' },
            { id: 'opt_srp_2_4', text: 'Hanya ada di web browser pengguna.' },
          ],
          explanation: 'Use case berada di Application Layer dan mengorkestrasi entitas domain untuk menyelesaikan satu skenario bisnis tunggal.',
          difficulty: 'easy',
        },
      ],
      isPublished: true,
    })
    .onConflictDoNothing();

  // 4. Create Sample API Key for Superadmin
  const sampleKey = 'fl_live_masterdeveloper2026';
  const samplePrefix = 'fl_live_master...';
  const hashed = createHash('sha256').update(sampleKey).digest('hex');

  await db
    .insert(apiKeys)
    .values({
      userId: admin.id,
      name: 'Default Master Developer Key',
      keyPrefix: samplePrefix,
      hashedKey: hashed,
      permissions: ['*'],
      expiresAt: null,
    })
    .onConflictDoNothing();

  console.log('✓ Master API Key seeded for Superadmin:');
  console.log(`  Key: ${sampleKey}`);

  // 5. Seed Procurement (PBJ) Domain Blueprint
  await seedProcurement(creator.id);

  console.log('🎉 FlashLearn Database Seeding Finished Successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
