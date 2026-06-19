UPDATE "offers"
SET
  "required_documents" = '["identity", "school_certificate"]'::jsonb,
  "updated_at" = now()
WHERE "code" = 'IMAGINE_R_ETUDIANT'
  AND "required_documents" = '["identité", "certificat_scolarite"]'::jsonb;
