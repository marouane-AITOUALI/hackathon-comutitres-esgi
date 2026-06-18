ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "price_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "monthly_installment_count" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp with time zone;--> statement-breakpoint

UPDATE "offers"
SET
  "price_cents" = CASE "code"
    WHEN 'NAVIGO_ANNUEL' THEN 97600
    WHEN 'NAVIGO_SENIOR' THEN 42000
    WHEN 'NAVIGO_MOIS' THEN 8800
    WHEN 'NAVIGO_SEMAINE' THEN 3080
    WHEN 'IMAGINE_R_JUNIOR' THEN 2400
    WHEN 'IMAGINE_R_SCOLAIRE' THEN 38240
    WHEN 'IMAGINE_R_ETUDIANT' THEN 38240
    WHEN 'LIBERTE_PLUS' THEN 0
    WHEN 'TST_50' THEN 4400
    WHEN 'TST_75' THEN 2200
    WHEN 'TST_GRATUITE' THEN 0
    WHEN 'AMETHYSTE' THEN 0
    ELSE "price_cents"
  END,
  "monthly_installment_count" = CASE
    WHEN "code" IN ('NAVIGO_ANNUEL', 'NAVIGO_SENIOR') THEN 12
    WHEN "code" IN ('IMAGINE_R_JUNIOR', 'IMAGINE_R_SCOLAIRE', 'IMAGINE_R_ETUDIANT') THEN 10
    ELSE NULL
  END;--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "subscriptions"
    WHERE "status" IN ('draft', 'pending_documents', 'pending_payment', 'pending_validation', 'accepted', 'suspended')
    GROUP BY "user_id"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE NOTICE 'Index unique différé : des doublons historiques existent et sont conservés.';
  ELSE
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_one_open_per_user_idx"
      ON "subscriptions" ("user_id")
      WHERE "status" IN (''draft'', ''pending_documents'', ''pending_payment'', ''pending_validation'', ''accepted'', ''suspended'')';
  END IF;
END $$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION "prevent_multiple_open_subscriptions"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."status" IN ('draft', 'pending_documents', 'pending_payment', 'pending_validation', 'accepted', 'suspended')
    AND (
      TG_OP = 'INSERT'
      OR OLD."user_id" <> NEW."user_id"
      OR OLD."status" NOT IN ('draft', 'pending_documents', 'pending_payment', 'pending_validation', 'accepted', 'suspended')
    )
    AND EXISTS (
      SELECT 1
      FROM "subscriptions"
      WHERE "user_id" = NEW."user_id"
        AND "id" <> NEW."id"
        AND "status" IN ('draft', 'pending_documents', 'pending_payment', 'pending_validation', 'accepted', 'suspended')
    )
  THEN
    RAISE EXCEPTION 'Un dossier actif existe déjà pour cet utilisateur.';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS "subscriptions_one_open_per_user_guard" ON "subscriptions";--> statement-breakpoint
CREATE TRIGGER "subscriptions_one_open_per_user_guard"
BEFORE INSERT OR UPDATE OF "user_id", "status"
ON "subscriptions"
FOR EACH ROW
EXECUTE FUNCTION "prevent_multiple_open_subscriptions"();
