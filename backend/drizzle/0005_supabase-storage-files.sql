CREATE TABLE "user_avatars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"storage_bucket" text DEFAULT 'user-avatars' NOT NULL,
	"storage_path" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "storage"."buckets" ("id", "name", "public", "file_size_limit", "allowed_mime_types")
VALUES
	('user-avatars', 'user-avatars', false, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
	('subscription-documents', 'subscription-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
ON CONFLICT ("id") DO UPDATE
SET
	"public" = EXCLUDED."public",
	"file_size_limit" = EXCLUDED."file_size_limit",
	"allowed_mime_types" = EXCLUDED."allowed_mime_types";
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "storage_bucket" text DEFAULT 'subscription-documents';--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "storage_path" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "original_filename" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "mime_type" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "size_bytes" integer;--> statement-breakpoint
UPDATE "documents" AS document
SET
	"owner_id" = subscription."user_id",
	"storage_bucket" = COALESCE(document."storage_bucket", 'subscription-documents'),
	"storage_path" = COALESCE(document."storage_path", document."file_url"),
	"original_filename" = COALESCE(document."original_filename", NULLIF(regexp_replace(document."file_url", '^.*/', ''), ''))
FROM "subscriptions" AS subscription
WHERE document."subscription_id" = subscription."id";
--> statement-breakpoint
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_avatars_owner_id_idx" ON "user_avatars" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "user_avatars_storage_path_idx" ON "user_avatars" USING btree ("storage_path");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_owner_id_idx" ON "documents" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "documents_storage_path_idx" ON "documents" USING btree ("storage_path");
