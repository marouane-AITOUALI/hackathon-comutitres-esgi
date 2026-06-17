ALTER TYPE "public"."document_status" ADD VALUE 'analyzing' BEFORE 'validated';--> statement-breakpoint
ALTER TYPE "public"."document_status" ADD VALUE 'needs_manual_review';--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "analysis_result" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "analyzed_at" timestamp with time zone;