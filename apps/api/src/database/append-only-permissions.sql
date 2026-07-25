DO $$
BEGIN
  UPDATE admin_audit_log SET action = 'x' WHERE 1=1;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'permission denied';
END $$;

DO $$
BEGIN
  DELETE FROM escrow_events WHERE 1=1;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'permission denied';
END $$;
