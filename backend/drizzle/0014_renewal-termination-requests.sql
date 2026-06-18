ALTER TYPE "renewal_action" ADD VALUE IF NOT EXISTS 'requested';--> statement-breakpoint
ALTER TYPE "renewal_action" ADD VALUE IF NOT EXISTS 'cancelled';--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "termination_request_status" AS ENUM ('requested', 'cancelled', 'processed', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "termination_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "subscription_id" uuid NOT NULL,
  "status" "termination_request_status" DEFAULT 'requested' NOT NULL,
  "reason" text,
  "effective_at" timestamp with time zone NOT NULL,
  "processed_at" timestamp with time zone,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "termination_requests" ADD CONSTRAINT "termination_requests_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "termination_requests" ADD CONSTRAINT "termination_requests_subscription_id_subscriptions_id_fk"
    FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "termination_requests_user_id_idx" ON "termination_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "termination_requests_subscription_id_idx" ON "termination_requests" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "termination_requests_status_idx" ON "termination_requests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "termination_requests_one_pending_idx"
  ON "termination_requests" ("subscription_id")
  WHERE "status" = 'requested';
