import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const ADVISORY_LOCK_ID = 84920384; // Deterministic lock ID for FlashLearn DB migrations

async function runSafeMigration() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:T1sy7cEhciZI4FeMSCc6JzwkBcokqA4ubRBNVmRhLZWLrvKEoGjsORiF6nIoRcSl@localhost:5432/flashlearn';

  console.log('⚡ [DB Migration] Initializing PostgreSQL connection with max=1...');
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  let lockAcquired = false;

  try {
    // 1. Acquire PostgreSQL Advisory Lock (Mutual Exclusion across replicas)
    console.log(`🔒 [DB Migration] Acquiring advisory lock (${ADVISORY_LOCK_ID})...`);
    await sql`SELECT pg_advisory_lock(${ADVISORY_LOCK_ID});`;
    lockAcquired = true;
    console.log('✓ [DB Migration] Advisory lock acquired successfully.');

    // 2. Check if this is an existing database without migration journal
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'workspaces', 'contents');
    `;

    // Ensure drizzle schema and __drizzle_migrations table exists
    await sql`CREATE SCHEMA IF NOT EXISTS drizzle;`;
    await sql`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      );
    `;

    const existingMigrations = await sql`
      SELECT count(*)::int as count FROM drizzle.__drizzle_migrations;
    `;

    const migrationsCount = existingMigrations[0]?.count || 0;

    // 3. Baseline Legacy Databases
    // If core tables exist but no migrations recorded, baseline initial 0000 migration
    if (existingTables.length > 0 && migrationsCount === 0) {
      console.log('ℹ️ [DB Migration] Existing tables detected without migration record. Baselining 0000 migration...');
      const migrationsFolder = join(import.meta.dir, '../../../drizzle');
      const journalPath = join(migrationsFolder, 'meta/_journal.json');

      if (existsSync(journalPath)) {
        const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
        const firstEntry = journal.entries?.[0];
        if (firstEntry) {
          const sqlFile = join(migrationsFolder, `${firstEntry.tag}.sql`);
          if (existsSync(sqlFile)) {
            const sqlContent = readFileSync(sqlFile, 'utf8');
            const hash = createHash('sha256').update(sqlContent).digest('hex');
            await sql`
              INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
              VALUES (${hash}, ${firstEntry.when})
              ON CONFLICT DO NOTHING;
            `;
            console.log(`✓ [DB Migration] Baseline entry recorded for ${firstEntry.tag}`);
          }
        }
      }
    }

    // 3b. Backfill missing 0000 tables if legacy database was already baselined without them
    if (existingTables.length > 0) {
      const sourceCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sources';
      `;

      if (sourceCheck.length === 0) {
        console.log('ℹ️ [DB Migration] Backfilling missing sources & source_chunks from 0000 baseline...');
        await sql`
          CREATE TABLE IF NOT EXISTS "sources" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "workspace_id" uuid NOT NULL,
            "title" text NOT NULL,
            "code" text NOT NULL,
            "version" text NOT NULL,
            "status" text DEFAULT 'active' NOT NULL,
            "owner" text NOT NULL,
            "effective_date" timestamp with time zone NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
            CONSTRAINT "sources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action
          );
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS "source_chunks" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "source_id" uuid NOT NULL,
            "location_tag" text NOT NULL,
            "content" text NOT NULL,
            "token_count" integer DEFAULT 0 NOT NULL,
            "sha256_hash" text NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            CONSTRAINT "source_chunks_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action
          );
        `;
        await sql`CREATE INDEX IF NOT EXISTS "idx_source_chunks_source_id" ON "source_chunks" USING btree ("source_id");`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_source_chunks_location_tag" ON "source_chunks" USING btree ("location_tag");`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_source_chunks_source_loc" ON "source_chunks" USING btree ("source_id","location_tag");`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_sources_workspace_id" ON "sources" USING btree ("workspace_id");`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_sources_code" ON "sources" USING btree ("code");`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_sources_status" ON "sources" USING btree ("status");`;
        console.log('✓ [DB Migration] sources & source_chunks backfilled successfully.');
      }
    }

    // 4. Run Drizzle Migrator
    const migrationsFolder = join(import.meta.dir, '../../../drizzle');
    console.log(`🚀 [DB Migration] Applying pending migrations from ${migrationsFolder}...`);
    await migrate(db, { migrationsFolder });
    console.log('✓ [DB Migration] All pending migrations executed successfully.');

    // 5. Schema Integrity Healthcheck
    const verifiedTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'workspaces', 'contents', 'sources', 'source_chunks');
    `;

    if (verifiedTables.length < 5) {
      throw new Error(`Schema integrity check failed. Expected 5 core tables, found ${verifiedTables.length}`);
    }
    console.log(`✓ [DB Migration] Schema integrity verified (Found ${verifiedTables.length} core tables).`);

    // 6. Fresh instance notification
    const userCount = await sql`SELECT count(*)::int as count FROM users;`;
    if (userCount[0]?.count === 0) {
      console.log('🌱 [DB Migration] Fresh database detected (0 users).');
    }
  } catch (error: any) {
    console.error('❌ [DB Migration] Critical migration failure:', error.message);
    throw error;
  } finally {
    if (lockAcquired) {
      try {
        await sql`SELECT pg_advisory_unlock(${ADVISORY_LOCK_ID});`;
        console.log('🔓 [DB Migration] Advisory lock released.');
      } catch (unlockErr: any) {
        console.warn('⚠️ [DB Migration] Failed to release lock:', unlockErr.message);
      }
    }
    await sql.end();
  }
}

runSafeMigration()
  .then(() => {
    console.log('🎉 [DB Migration] Migration routine completed successfully.\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 [DB Migration] Process aborted with error:', err);
    process.exit(1);
  });
