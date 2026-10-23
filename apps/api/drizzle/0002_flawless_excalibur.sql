CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"submission" jsonb NOT NULL,
	"score" integer NOT NULL,
	"feedback" text NOT NULL,
	"assessed_by" text NOT NULL,
	"oracle_class_used" text NOT NULL,
	"passed" boolean NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competency_id" uuid NOT NULL,
	"title" text NOT NULL,
	"scenario" text NOT NULL,
	"task_type" text NOT NULL,
	"oracle_data" jsonb NOT NULL,
	"rubric_criteria" jsonb NOT NULL,
	"passing_score" integer DEFAULT 85 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_attempts_task_id" ON "attempts" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_attempts_user_id" ON "attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_attempts_passed" ON "attempts" USING btree ("passed");--> statement-breakpoint
CREATE INDEX "idx_tasks_competency_id" ON "tasks" USING btree ("competency_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_task_type" ON "tasks" USING btree ("task_type");