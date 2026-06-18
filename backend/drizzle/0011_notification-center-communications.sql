CREATE TYPE "public"."communication_audience" AS ENUM('clients', 'admins', 'everyone');--> statement-breakpoint
CREATE TYPE "public"."notification_category" AS ENUM('subscription', 'document', 'payment', 'renewal', 'communication', 'system');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('low', 'normal', 'high');--> statement-breakpoint
CREATE TABLE "communications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid,
	"audience" "communication_audience" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"priority" "notification_priority" DEFAULT 'normal' NOT NULL,
	"action_label" text,
	"action_path" text,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "communication_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "category" "notification_category" DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "priority" "notification_priority" DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "communications_created_by_idx" ON "communications" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "communications_audience_idx" ON "communications" USING btree ("audience");--> statement-breakpoint
CREATE INDEX "communications_published_at_idx" ON "communications" USING btree ("published_at");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_communication_id_communications_id_fk" FOREIGN KEY ("communication_id") REFERENCES "public"."communications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_communication_id_idx" ON "notifications" USING btree ("communication_id");--> statement-breakpoint
CREATE INDEX "notifications_category_idx" ON "notifications" USING btree ("category");
