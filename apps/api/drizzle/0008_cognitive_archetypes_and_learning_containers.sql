-- Migration 0008: Add cognitive_archetype to competencies and enforce learning container binding

ALTER TABLE "competencies" ADD COLUMN IF NOT EXISTS "cognitive_archetype" text DEFAULT 'ill_structured_case' NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_competencies_archetype" ON "competencies" USING btree ("cognitive_archetype");
