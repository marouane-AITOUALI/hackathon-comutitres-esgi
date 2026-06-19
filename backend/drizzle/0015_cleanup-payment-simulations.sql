DELETE FROM "payments"
WHERE "type" = 'simulation'
  AND "status" = 'simulated';
