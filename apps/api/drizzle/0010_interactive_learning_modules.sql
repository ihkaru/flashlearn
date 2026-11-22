-- Migration 0010: Interactive Bridging Modules (UILA v2), Lazy-Loaded HTML Artifacts, and Seamless Learner Resume Progress

-- 1. Contents: structured UILA v2 + Bridging Analogies JSON payload
ALTER TABLE "contents" ADD COLUMN IF NOT EXISTS "interactive_payload" jsonb;

-- 2. Lazy-loaded sandboxed HTML artifacts (Slide Decks & Custom Anchoring Micro-Sims)
CREATE TABLE IF NOT EXISTS "content_artifacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "content_id" uuid NOT NULL,
  "kind" text NOT NULL,
  "mime_type" text DEFAULT 'text/html' NOT NULL,
  "html_content" text NOT NULL,
  "sha256_hash" text NOT NULL,
  "byte_size" integer NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "content_artifacts_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_content_artifacts_content_kind" ON "content_artifacts" USING btree ("content_id", "kind");
CREATE INDEX IF NOT EXISTS "idx_content_artifacts_content_id" ON "content_artifacts" USING btree ("content_id");

-- 3. Learner Content Progress for Seamless Resume (Authenticated Users & Anonymous Guest Sessions)
CREATE TABLE IF NOT EXISTS "learner_content_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "content_id" uuid NOT NULL,
  "user_id" uuid,
  "session_key" text,
  "current_step_index" integer DEFAULT 0 NOT NULL,
  "total_steps" integer DEFAULT 1 NOT NULL,
  "current_slide_index" integer DEFAULT 0 NOT NULL,
  "completed_step_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "anchoring_completed" boolean DEFAULT false NOT NULL,
  "diagnostic_attempts" integer DEFAULT 0 NOT NULL,
  "last_loss_score" numeric(4, 3),
  "loss_vector" jsonb,
  "theta_mastery" numeric(4, 3) DEFAULT '0.000' NOT NULL,
  "is_completed" boolean DEFAULT false NOT NULL,
  "daily_activity_log" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "learner_content_progress_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "learner_content_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "idx_lcp_content_id" ON "learner_content_progress" USING btree ("content_id");
CREATE INDEX IF NOT EXISTS "idx_lcp_user_updated" ON "learner_content_progress" USING btree ("user_id", "updated_at");
CREATE INDEX IF NOT EXISTS "idx_lcp_session_updated" ON "learner_content_progress" USING btree ("session_key", "updated_at");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_lcp_content_user" ON "learner_content_progress" ("content_id", "user_id") WHERE "user_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "idx_lcp_content_session" ON "learner_content_progress" ("content_id", "session_key") WHERE "user_id" IS NULL AND "session_key" IS NOT NULL;
