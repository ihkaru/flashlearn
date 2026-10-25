-- Migration 0009: Causal Priming Decks, Scenario Variants, Unaided Practice Gates, and Verifiable Execution Hash

-- 1. Gate Requirements: multi-observation entrustment threshold
ALTER TABLE "gate_requirements" ADD COLUMN IF NOT EXISTS "required_observations_count" integer DEFAULT 1 NOT NULL;

-- 2. Tasks: isomorphic variant tracking
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "scenario_variant_code" text DEFAULT 'variant_a' NOT NULL;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "is_isomorphic_variant" boolean DEFAULT false NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_tasks_variant" ON "tasks" USING btree ("scenario_variant_code");

-- 3. Attempts: unaided practice vs AI-guided sandbox tracking
ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "is_unaided" boolean DEFAULT false NOT NULL;
ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "ai_hints_used_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "is_practice" boolean DEFAULT false NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_attempts_unaided" ON "attempts" USING btree ("is_unaided");

-- 4. Mastery Records: unaided sandbox milestone & passed variant codes
ALTER TABLE "mastery_records" ADD COLUMN IF NOT EXISTS "has_passed_unaided_sandbox" boolean DEFAULT false NOT NULL;
ALTER TABLE "mastery_records" ADD COLUMN IF NOT EXISTS "passed_variant_codes" jsonb DEFAULT '[]'::jsonb NOT NULL;

-- 5. Spaced Flashcards: causal schema priming card types and prediction options
ALTER TABLE "spaced_flashcards" ADD COLUMN IF NOT EXISTS "card_type" text DEFAULT 'definition' NOT NULL;
ALTER TABLE "spaced_flashcards" ADD COLUMN IF NOT EXISTS "prediction_options" jsonb;
ALTER TABLE "spaced_flashcards" ADD COLUMN IF NOT EXISTS "causal_rationale" text;
CREATE INDEX IF NOT EXISTS "idx_spaced_fc_type" ON "spaced_flashcards" USING btree ("card_type");

-- 6. Issued Credentials: cryptographic execution artifact hash for anti-spoofing
ALTER TABLE "issued_credentials" ADD COLUMN IF NOT EXISTS "execution_artifact_hash" text;
CREATE INDEX IF NOT EXISTS "idx_issued_credentials_artifact_hash" ON "issued_credentials" USING btree ("execution_artifact_hash");
