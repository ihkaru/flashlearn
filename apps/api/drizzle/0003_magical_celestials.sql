CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gate_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gate_id" uuid NOT NULL,
	"competency_id" uuid NOT NULL,
	"minimum_score" integer DEFAULT 80 NOT NULL,
	"requires_human_approval" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"level" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spaced_flashcards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"competency_id" uuid NOT NULL,
	"source_chunk_id" uuid,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"repetition_interval_days" integer DEFAULT 1 NOT NULL,
	"ease_factor" integer DEFAULT 250 NOT NULL,
	"repetition_count" integer DEFAULT 0 NOT NULL,
	"next_review_due" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_gate_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"gate_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"granted_by" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"revocation_reason" text,
	"evidence_snapshot" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_requirements" ADD CONSTRAINT "gate_requirements_gate_id_gates_id_fk" FOREIGN KEY ("gate_id") REFERENCES "public"."gates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_requirements" ADD CONSTRAINT "gate_requirements_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gates" ADD CONSTRAINT "gates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaced_flashcards" ADD CONSTRAINT "spaced_flashcards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaced_flashcards" ADD CONSTRAINT "spaced_flashcards_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaced_flashcards" ADD CONSTRAINT "spaced_flashcards_source_chunk_id_source_chunks_id_fk" FOREIGN KEY ("source_chunk_id") REFERENCES "public"."source_chunks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gate_grants" ADD CONSTRAINT "user_gate_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gate_grants" ADD CONSTRAINT "user_gate_grants_gate_id_gates_id_fk" FOREIGN KEY ("gate_id") REFERENCES "public"."gates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_workspace" ON "audit_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_target" ON "audit_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_gate_req_gate" ON "gate_requirements" USING btree ("gate_id");--> statement-breakpoint
CREATE INDEX "idx_gate_req_comp" ON "gate_requirements" USING btree ("competency_id");--> statement-breakpoint
CREATE INDEX "idx_gates_workspace_id" ON "gates" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_gates_level" ON "gates" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_spaced_fc_user" ON "spaced_flashcards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_spaced_fc_due" ON "spaced_flashcards" USING btree ("next_review_due");--> statement-breakpoint
CREATE INDEX "idx_spaced_fc_comp" ON "spaced_flashcards" USING btree ("competency_id");--> statement-breakpoint
CREATE INDEX "idx_user_gate_grants_user" ON "user_gate_grants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_gate_grants_gate" ON "user_gate_grants" USING btree ("gate_id");--> statement-breakpoint
CREATE INDEX "idx_user_gate_grants_status" ON "user_gate_grants" USING btree ("status");