CREATE TABLE IF NOT EXISTS "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"target_role" text NOT NULL,
	"responsibility_scope" text NOT NULL,
	"legal_authority_level" integer DEFAULT 1 NOT NULL,
	"min_passing_score" integer DEFAULT 80 NOT NULL,
	"icon" text,
	"cover_image" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "socratic_chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid,
	"workspace_id" uuid NOT NULL,
	"domain_id" uuid,
	"merkle_root" text,
	"status" text DEFAULT 'active' NOT NULL,
	"turn_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "socratic_chat_turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"turn_index" integer NOT NULL,
	"sender" text NOT NULL,
	"message" text NOT NULL,
	"turn_hash" text NOT NULL,
	"anti_spoiler_blocked" boolean DEFAULT false NOT NULL,
	"cited_chunk_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_source_citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"source_chunk_id" uuid NOT NULL,
	"relevance_score" numeric(4, 2) DEFAULT '1.0' NOT NULL,
	"annotation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contents" ADD COLUMN IF NOT EXISTS "domain_id" uuid;
--> statement-breakpoint
ALTER TABLE "competencies" ADD COLUMN IF NOT EXISTS "domain_id" uuid;
--> statement-breakpoint
ALTER TABLE "gates" ADD COLUMN IF NOT EXISTS "domain_id" uuid;
--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "domain_id" uuid;
--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" ADD COLUMN IF NOT EXISTS "domain_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "domains" ADD CONSTRAINT "domains_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "socratic_chat_sessions" ADD CONSTRAINT "socratic_chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "socratic_chat_sessions" ADD CONSTRAINT "socratic_chat_sessions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "socratic_chat_sessions" ADD CONSTRAINT "socratic_chat_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "socratic_chat_sessions" ADD CONSTRAINT "socratic_chat_sessions_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "socratic_chat_turns" ADD CONSTRAINT "socratic_chat_turns_session_id_socratic_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."socratic_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_source_citations" ADD CONSTRAINT "content_source_citations_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_source_citations" ADD CONSTRAINT "content_source_citations_source_chunk_id_source_chunks_id_fk" FOREIGN KEY ("source_chunk_id") REFERENCES "public"."source_chunks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contents" ADD CONSTRAINT "contents_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "competencies" ADD CONSTRAINT "competencies_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gates" ADD CONSTRAINT "gates_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sources" ADD CONSTRAINT "sources_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_domains_ws_slug" ON "domains" USING btree ("workspace_id","slug");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_domains_ws_code" ON "domains" USING btree ("workspace_id","code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_domains_workspace_id" ON "domains" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_domains_status" ON "domains" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_socratic_sessions_user" ON "socratic_chat_sessions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_socratic_sessions_task" ON "socratic_chat_sessions" USING btree ("task_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_socratic_sessions_workspace" ON "socratic_chat_sessions" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_socratic_sessions_domain" ON "socratic_chat_sessions" USING btree ("domain_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_socratic_turns_session_index" ON "socratic_chat_turns" USING btree ("session_id","turn_index");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_socratic_turns_session" ON "socratic_chat_turns" USING btree ("session_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_content_chunk_unique" ON "content_source_citations" USING btree ("content_id","source_chunk_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_citations_content" ON "content_source_citations" USING btree ("content_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_citations_chunk" ON "content_source_citations" USING btree ("source_chunk_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contents_domain_id" ON "contents" USING btree ("domain_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_competencies_domain_id" ON "competencies" USING btree ("domain_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gates_domain_id" ON "gates" USING btree ("domain_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sources_domain_id" ON "sources" USING btree ("domain_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_diagnostic_sessions_domain" ON "diagnostic_sessions" USING btree ("domain_id");
--> statement-breakpoint
-- AUTO-BACKFILL EXISTING WORKSPACES INTO DEFAULT DOMAINS
DO $$
DECLARE
    ws RECORD;
    new_domain_id uuid;
BEGIN
    FOR ws IN SELECT id, name, slug, description FROM "workspaces" LOOP
        -- Check if a domain already exists for this workspace
        SELECT id INTO new_domain_id FROM "domains" WHERE "workspace_id" = ws.id LIMIT 1;
        
        IF new_domain_id IS NULL THEN
            INSERT INTO "domains" (
                "workspace_id", "code", "name", "slug", "description", 
                "target_role", "responsibility_scope", "legal_authority_level", "min_passing_score", "status"
            ) VALUES (
                ws.id,
                'DOM-' || SUBSTRING(REPLACE(ws.slug, '-', '') FROM 1 FOR 6),
                ws.name,
                ws.slug,
                COALESCE(ws.description, 'Domain Kualifikasi Otoritas & Tanggung Jawab SDM'),
                'Praktisi Terverifikasi & Penanggung Jawab Otoritas',
                'Kewenangan penuh dalam pelaksanaan tugas teknis, kepatuhan regulasi, dan mitigasi risiko operasional.',
                1,
                80,
                'active'
            ) RETURNING id INTO new_domain_id;
        END IF;

        -- Link unassociated records to this domain
        UPDATE "competencies" SET "domain_id" = new_domain_id WHERE "workspace_id" = ws.id AND "domain_id" IS NULL;
        UPDATE "gates" SET "domain_id" = new_domain_id WHERE "workspace_id" = ws.id AND "domain_id" IS NULL;
        UPDATE "sources" SET "domain_id" = new_domain_id WHERE "workspace_id" = ws.id AND "domain_id" IS NULL;
        UPDATE "diagnostic_sessions" SET "domain_id" = new_domain_id WHERE "workspace_id" = ws.id AND "domain_id" IS NULL;
        UPDATE "contents" SET "domain_id" = new_domain_id WHERE "workspace_id" = ws.id AND "domain_id" IS NULL;
    END LOOP;
END $$;
