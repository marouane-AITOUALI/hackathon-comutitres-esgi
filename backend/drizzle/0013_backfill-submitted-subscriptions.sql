UPDATE "subscriptions"
SET "submitted_at" = "updated_at"
WHERE "submitted_at" IS NULL
  AND "status" IN ('pending_documents', 'pending_payment', 'pending_validation');
