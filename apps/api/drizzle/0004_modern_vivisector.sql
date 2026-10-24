DROP INDEX "idx_mastery_user_comp";--> statement-breakpoint
ALTER TABLE "competency_edges" ADD CONSTRAINT "competency_edges_competency_id_prerequisite_id_pk" PRIMARY KEY("competency_id","prerequisite_id");--> statement-breakpoint
ALTER TABLE "competencies" ADD COLUMN "source_id" uuid;--> statement-breakpoint
ALTER TABLE "contents" ADD COLUMN "competency_id" uuid;--> statement-breakpoint
ALTER TABLE "competencies" ADD CONSTRAINT "competencies_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_competencies_source_id" ON "competencies" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_contents_competency_id" ON "contents" USING btree ("competency_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_gate_req_unique" ON "gate_requirements" USING btree ("gate_id","competency_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_mastery_user_comp_unique" ON "mastery_records" USING btree ("user_id","competency_id");