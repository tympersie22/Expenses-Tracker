ALTER TABLE "AuditEvent" ADD COLUMN "hashVersion" INTEGER NOT NULL DEFAULT 1;

-- Account erasure still cascades; direct deletion while its owner exists does not.
CREATE FUNCTION reject_direct_audit_delete() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "User" WHERE "id" = OLD."userId") THEN
    RAISE EXCEPTION 'Audit events may only be removed with account deletion';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "AuditEvent_no_direct_delete"
  BEFORE DELETE ON "AuditEvent"
  FOR EACH ROW EXECUTE FUNCTION reject_direct_audit_delete();
