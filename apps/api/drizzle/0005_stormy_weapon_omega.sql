CREATE TABLE "diagnostic_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"probed_items" jsonb NOT NULL,
	"inferred_masteries" jsonb NOT NULL,
	"state_distribution" jsonb,
	"current_fringe" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attempt_consensus_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"status" text DEFAULT 'in_review' NOT NULL,
	"observed_agreement" numeric(5, 4),
	"gwet_ac1" numeric(5, 4),
	"gwet_ac2" numeric(5, 4),
	"cohen_kappa" numeric(5, 4),
	"score_delta" numeric(6, 2),
	"final_score" integer,
	"passed" boolean,
	"arbiter_review_id" uuid,
	"metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attempt_consensus_records_attempt_id_unique" UNIQUE("attempt_id")
);
--> statement-breakpoint
CREATE TABLE "task_attempt_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"blind_token" text NOT NULL,
	"role" text DEFAULT 'primary' NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"rubric_scores" jsonb,
	"total_score" integer,
	"notes" text,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_attempt_reviews_blind_token_unique" UNIQUE("blind_token")
);
--> statement-breakpoint
CREATE TABLE "issued_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"gate_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"vc_payload" jsonb NOT NULL,
	"signature_proof" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_keypairs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"public_key_multibase" text NOT NULL,
	"public_key_pem" text NOT NULL,
	"private_key_pem" text NOT NULL,
	"did_identifier" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_keypairs_workspace_id_unique" UNIQUE("workspace_id"),
	CONSTRAINT "workspace_keypairs_did_identifier_unique" UNIQUE("did_identifier")
);
--> statement-breakpoint
ALTER TABLE "mastery_records" ADD COLUMN "difficulty" numeric(4, 2) DEFAULT '5.0' NOT NULL;--> statement-breakpoint
ALTER TABLE "mastery_records" ADD COLUMN "stability" numeric(6, 2) DEFAULT '30.0' NOT NULL;--> statement-breakpoint
ALTER TABLE "mastery_records" ADD COLUMN "last_demonstrated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "mastery_records" ADD COLUMN "cached_retrievability" numeric(4, 3) DEFAULT '1.0' NOT NULL;--> statement-breakpoint
ALTER TABLE "mastery_records" ADD COLUMN "drift_status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "adversarial_spec" jsonb;--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_consensus_records" ADD CONSTRAINT "attempt_consensus_records_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_consensus_records" ADD CONSTRAINT "attempt_consensus_records_arbiter_review_id_task_attempt_reviews_id_fk" FOREIGN KEY ("arbiter_review_id") REFERENCES "public"."task_attempt_reviews"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attempt_reviews" ADD CONSTRAINT "task_attempt_reviews_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attempt_reviews" ADD CONSTRAINT "task_attempt_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_credentials" ADD CONSTRAINT "issued_credentials_gate_id_gates_id_fk" FOREIGN KEY ("gate_id") REFERENCES "public"."gates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_credentials" ADD CONSTRAINT "issued_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_credentials" ADD CONSTRAINT "issued_credentials_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_keypairs" ADD CONSTRAINT "workspace_keypairs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_diagnostic_sessions_workspace" ON "diagnostic_sessions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_sessions_user" ON "diagnostic_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_attempt_consensus_attempt" ON "attempt_consensus_records" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "idx_attempt_consensus_status" ON "attempt_consensus_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_task_attempt_reviews_attempt" ON "task_attempt_reviews" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "idx_task_attempt_reviews_reviewer" ON "task_attempt_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_task_attempt_reviews_token" ON "task_attempt_reviews" USING btree ("blind_token");--> statement-breakpoint
CREATE INDEX "idx_task_attempt_reviews_status" ON "task_attempt_reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_issued_credentials_user" ON "issued_credentials" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_issued_credentials_gate" ON "issued_credentials" USING btree ("gate_id");--> statement-breakpoint
CREATE INDEX "idx_issued_credentials_ws" ON "issued_credentials" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_keypairs_ws" ON "workspace_keypairs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_mastery_drift_status" ON "mastery_records" USING btree ("drift_status");--> statement-breakpoint
CREATE INDEX "idx_mastery_cached_r" ON "mastery_records" USING btree ("cached_retrievability");