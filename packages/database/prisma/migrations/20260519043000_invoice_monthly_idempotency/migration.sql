-- Ensure monthly invoice generation is idempotent at the database level.
-- This migration is defensive: it refuses to proceed if duplicate monthly
-- invoices already exist, so production data is never silently merged or lost.

DO $$
DECLARE
  duplicate_child_count integer;
  duplicate_student_count integer;
BEGIN
  SELECT COUNT(*) INTO duplicate_child_count
  FROM (
    SELECT "schoolId", "childId", "referenceMonth"
    FROM "Invoice"
    WHERE "childId" IS NOT NULL
      AND "referenceMonth" IS NOT NULL
    GROUP BY "schoolId", "childId", "referenceMonth"
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_child_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: duplicate child monthly invoices exist. Resolve duplicates before adding Invoice_schoolId_childId_referenceMonth_key.';
  END IF;

  SELECT COUNT(*) INTO duplicate_student_count
  FROM (
    SELECT "schoolId", "studentId", "referenceMonth"
    FROM "Invoice"
    WHERE "studentId" IS NOT NULL
      AND "referenceMonth" IS NOT NULL
    GROUP BY "schoolId", "studentId", "referenceMonth"
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_student_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: duplicate student monthly invoices exist. Resolve duplicates before adding Invoice_schoolId_studentId_referenceMonth_key.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_schoolId_childId_referenceMonth_key"
  ON "Invoice"("schoolId", "childId", "referenceMonth");

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_schoolId_studentId_referenceMonth_key"
  ON "Invoice"("schoolId", "studentId", "referenceMonth");
