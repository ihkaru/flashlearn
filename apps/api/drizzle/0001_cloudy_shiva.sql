CREATE TABLE "competencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"oracle_class" text NOT NULL,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"is_expert_approved" boolean DEFAULT false NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competency_edges" (
	"competency_id" uuid NOT NULL,
	"prerequisite_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mastery_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"competency_id" uuid NOT NULL,
	"status" text DEFAULT 'ready' NOT NULL,
	"verified_attempt_id" uuid,
	"mastered_at" timestamp with time zone,
	"retest_due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competencies" ADD CONSTRAINT "competencies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competencies" ADD CONSTRAINT "competencies_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_edges" ADD CONSTRAINT "competency_edges_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_edges" ADD CONSTRAINT "competency_edges_prerequisite_id_competencies_id_fk" FOREIGN KEY ("prerequisite_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_records" ADD CONSTRAINT "mastery_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_records" ADD CONSTRAINT "mastery_records_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_competencies_workspace_id" ON "competencies" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_competencies_code" ON "competencies" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_competencies_oracle_class" ON "competencies" USING btree ("oracle_class");--> statement-breakpoint
CREATE INDEX "idx_competency_edges_comp" ON "competency_edges" USING btree ("competency_id");--> statement-breakpoint
CREATE INDEX "idx_competency_edges_prereq" ON "competency_edges" USING btree ("prerequisite_id");--> statement-breakpoint
CREATE INDEX "idx_mastery_records_user_id" ON "mastery_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mastery_records_comp_id" ON "mastery_records" USING btree ("competency_id");--> statement-breakpoint
CREATE INDEX "idx_mastery_user_comp" ON "mastery_records" USING btree ("user_id","competency_id");