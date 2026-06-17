CREATE TYPE "public"."accessibility_preference" AS ENUM('none', 'screen_reader', 'large_text', 'reduced_motion', 'plain_language', 'human_support');--> statement-breakpoint
CREATE TYPE "public"."contact_preference" AS ENUM('email', 'phone', 'sms');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_contact" "contact_preference" DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "accessibility_preference" "accessibility_preference" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "marketing_opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "marketing_opt_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_updated_at" timestamp with time zone;
