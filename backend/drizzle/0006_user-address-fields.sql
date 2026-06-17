ALTER TABLE "users" ADD COLUMN "address_line1" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address_line2" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country" text DEFAULT 'FR' NOT NULL;