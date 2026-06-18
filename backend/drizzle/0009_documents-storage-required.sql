DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO "storage"."buckets" ("id", "name", "public", "file_size_limit", "allowed_mime_types")
    VALUES
      ('user-avatars', 'user-avatars', false, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
      ('subscription-documents', 'subscription-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
    ON CONFLICT ("id") DO UPDATE
    SET
      "public" = EXCLUDED."public",
      "file_size_limit" = EXCLUDED."file_size_limit",
      "allowed_mime_types" = EXCLUDED."allowed_mime_types";
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "owner_id" uuid;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "storage_bucket" text DEFAULT 'subscription-documents';
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "storage_path" text;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "original_filename" text;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "mime_type" text;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "size_bytes" integer;
--> statement-breakpoint
UPDATE "documents" AS document
SET
  "owner_id" = COALESCE(document."owner_id", subscription."user_id"),
  "storage_bucket" = COALESCE(NULLIF(document."storage_bucket", ''), 'subscription-documents'),
  "storage_path" = COALESCE(NULLIF(document."storage_path", ''), NULLIF(document."file_url", ''), 'legacy/' || document."id"::text),
  "original_filename" = COALESCE(
    NULLIF(document."original_filename", ''),
    NULLIF(regexp_replace(COALESCE(NULLIF(document."file_url", ''), NULLIF(document."storage_path", ''), document."id"::text), '^.*/', ''), ''),
    document."id"::text || '.pdf'
  ),
  "mime_type" = COALESCE(
    NULLIF(document."mime_type", ''),
    CASE
      WHEN lower(COALESCE(document."file_url", document."storage_path", '')) LIKE '%.png' THEN 'image/png'
      WHEN lower(COALESCE(document."file_url", document."storage_path", '')) LIKE '%.jpg' THEN 'image/jpeg'
      WHEN lower(COALESCE(document."file_url", document."storage_path", '')) LIKE '%.jpeg' THEN 'image/jpeg'
      WHEN lower(COALESCE(document."file_url", document."storage_path", '')) LIKE '%.webp' THEN 'image/webp'
      WHEN lower(COALESCE(document."file_url", document."storage_path", '')) LIKE '%.heic' THEN 'image/heic'
      ELSE 'application/pdf'
    END
  ),
  "size_bytes" = COALESCE(document."size_bytes", 0),
  "updated_at" = now()
FROM "subscriptions" AS subscription
WHERE document."subscription_id" = subscription."id";
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "owner_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "storage_bucket" SET DEFAULT 'subscription-documents';
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "storage_bucket" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "storage_path" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "original_filename" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "mime_type" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "size_bytes" SET NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_owner_id_users_id_fk'
  ) THEN
    ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_owner_id_idx" ON "documents" USING btree ("owner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_storage_path_idx" ON "documents" USING btree ("storage_path");
