CREATE TABLE IF NOT EXISTS "media_asset_blobs" (
	"sha256" text PRIMARY KEY NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"data" bytea NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"sha256" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"storage_driver" text DEFAULT 'postgres' NOT NULL,
	"storage_key" text NOT NULL,
	"source_ref" text,
	"source_page" integer,
	"caption" text,
	"alt_text" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "media_assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_media_assets_workspace_sha256" ON "media_assets" USING btree ("workspace_id","sha256");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_media_assets_workspace_id" ON "media_assets" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_media_assets_sha256" ON "media_assets" USING btree ("sha256");
