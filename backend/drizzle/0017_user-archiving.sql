ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
