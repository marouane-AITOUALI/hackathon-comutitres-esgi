ALTER TYPE "public"."document_type" ADD VALUE IF NOT EXISTS 'school_certificate';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE IF NOT EXISTS 'tax_notice';--> statement-breakpoint
CREATE TYPE "public"."profile_status" AS ENUM('junior', 'school', 'student', 'active', 'senior', 'solidarity', 'other');--> statement-breakpoint
CREATE TYPE "public"."profile_type" AS ENUM('bearer', 'payer');--> statement-breakpoint
CREATE TYPE "public"."relationship_to_bearer" AS ENUM('parent', 'guardian', 'association', 'employer', 'other');--> statement-breakpoint
CREATE TYPE "public"."subscription_for" AS ENUM('self', 'child', 'other', 'organization_beneficiary');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
ALTER TYPE "public"."subscription_status" RENAME TO "subscription_status_legacy";--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('draft', 'pending_documents', 'pending_validation', 'accepted', 'rejected');--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" TYPE "public"."subscription_status" USING (
	CASE
		WHEN "status"::text = 'pending' THEN 'pending_validation'
		ELSE "status"::text
	END
)::"public"."subscription_status";--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
DROP TYPE "public"."subscription_status_legacy";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text DEFAULT 'DISABLED_LEGACY_ACCOUNT' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rgpd_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "rgpd_consent" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rgpd_consented_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "supabase_auth_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "birth_date";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "phone";--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "profile_type" NOT NULL,
	"status" "profile_status" DEFAULT 'other' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"birth_date" date,
	"email" text,
	"relationship_to_bearer" "relationship_to_bearer",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "onboarding_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bearer_profile_id" uuid,
	"payer_profile_id" uuid,
	"is_bearer_payer" boolean DEFAULT true NOT NULL,
	"current_step" text DEFAULT 'profile' NOT NULL,
	"subscription_for" "subscription_for" NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DROP INDEX "offers_slug_idx";--> statement-breakpoint
ALTER TABLE "offers" RENAME COLUMN "slug" TO "code";--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "target" text DEFAULT 'A qualifier' NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ALTER COLUMN "target" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "required_documents" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" DROP COLUMN "monthly_price";--> statement-breakpoint
ALTER TABLE "offers" DROP COLUMN "audience";--> statement-breakpoint
DROP TYPE "public"."offer_audience";--> statement-breakpoint
CREATE UNIQUE INDEX "offers_code_idx" ON "offers" USING btree ("code");--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "offer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "bearer_profile_id" uuid;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "payer_profile_id" uuid;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "onboarding_session_id" uuid;--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "submitted_at";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "reviewed_at";--> statement-breakpoint
ALTER TABLE "documents" RENAME COLUMN "storage_path" TO "file_url";--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "original_name";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "mime_type";--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_bearer_profile_id_profiles_id_fk" FOREIGN KEY ("bearer_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_payer_profile_id_profiles_id_fk" FOREIGN KEY ("payer_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_bearer_profile_id_profiles_id_fk" FOREIGN KEY ("bearer_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payer_profile_id_profiles_id_fk" FOREIGN KEY ("payer_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_onboarding_session_id_onboarding_sessions_id_fk" FOREIGN KEY ("onboarding_session_id") REFERENCES "public"."onboarding_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profiles_user_id_idx" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profiles_type_idx" ON "profiles" USING btree ("type");--> statement-breakpoint
CREATE INDEX "onboarding_sessions_user_id_idx" ON "onboarding_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "onboarding_sessions_bearer_profile_id_idx" ON "onboarding_sessions" USING btree ("bearer_profile_id");--> statement-breakpoint
CREATE INDEX "onboarding_sessions_payer_profile_id_idx" ON "onboarding_sessions" USING btree ("payer_profile_id");--> statement-breakpoint
CREATE INDEX "subscriptions_bearer_profile_id_idx" ON "subscriptions" USING btree ("bearer_profile_id");--> statement-breakpoint
CREATE INDEX "subscriptions_payer_profile_id_idx" ON "subscriptions" USING btree ("payer_profile_id");--> statement-breakpoint
CREATE INDEX "subscriptions_onboarding_session_id_idx" ON "subscriptions" USING btree ("onboarding_session_id");--> statement-breakpoint
INSERT INTO "offers" ("code", "name", "description", "target", "required_documents", "is_active")
VALUES
	('NAVIGO_ANNUEL', 'Navigo Annuel', 'Forfait annuel pour des trajets reguliers.', 'Adulte voyageant quotidiennement', '["Piece d''identite", "Photo d''identite", "RIB"]'::jsonb, true),
	('NAVIGO_SENIOR', 'Navigo Annuel Senior', 'Forfait annuel adapte aux seniors eligibles.', 'Personne de 62 ans ou plus', '["Piece d''identite", "Photo d''identite"]'::jsonb, true),
	('NAVIGO_MOIS', 'Navigo Mois', 'Forfait valable un mois.', 'Voyageur regulier souhaitant rester flexible', '["Piece d''identite", "Photo d''identite"]'::jsonb, true),
	('NAVIGO_SEMAINE', 'Navigo Semaine', 'Forfait valable une semaine.', 'Voyageur ayant un besoin hebdomadaire', '["Piece d''identite", "Photo d''identite"]'::jsonb, true),
	('IMAGINE_R_JUNIOR', 'Imagine R Junior', 'Forfait annuel pour les plus jeunes.', 'Enfant de moins de 11 ans', '["Piece d''identite", "Justificatif de scolarite"]'::jsonb, true),
	('IMAGINE_R_SCOLAIRE', 'Imagine R Scolaire', 'Forfait annuel pour les scolaires.', 'Eleve du primaire au secondaire', '["Piece d''identite", "Certificat de scolarite"]'::jsonb, true),
	('IMAGINE_R_ETUDIANT', 'Imagine R Etudiant', 'Forfait annuel pour les etudiants.', 'Etudiant', '["Piece d''identite", "Certificat de scolarite"]'::jsonb, true),
	('LIBERTE_PLUS', 'Liberte+', 'Paiement des trajets effectues apres utilisation.', 'Voyageur occasionnel', '["Piece d''identite", "RIB"]'::jsonb, true),
	('TST_50', 'TST Reduction 50%', 'Reduction sociale sous conditions.', 'Beneficiaire de la tarification solidarite', '["Piece d''identite", "Justificatif de situation sociale"]'::jsonb, true),
	('TST_75', 'TST Solidarite 75%', 'Reduction sociale sous conditions.', 'Beneficiaire de la tarification solidarite', '["Piece d''identite", "Justificatif de situation sociale"]'::jsonb, true),
	('TST_GRATUITE', 'TST Solidarite Gratuite', 'Gratuite sous conditions sociales.', 'Beneficiaire de la gratuite transport', '["Piece d''identite", "Justificatif de situation sociale"]'::jsonb, true),
	('AMETHYSTE', 'Amethyste', 'Forfait finance par certains departements franciliens.', 'Senior ou personne en situation specifique selon le departement', '["Piece d''identite", "Justificatif de domicile"]'::jsonb, true)
ON CONFLICT ("code") DO UPDATE SET
	"name" = EXCLUDED."name",
	"description" = EXCLUDED."description",
	"target" = EXCLUDED."target",
	"required_documents" = EXCLUDED."required_documents",
	"is_active" = true,
	"updated_at" = now();
