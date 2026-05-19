-- Production foundations for Mundo Magico.
-- This migration is intentionally defensive: it validates existing data before
-- adding constraints that could otherwise fail halfway through deployment.

-- ---------------------------------------------------------------------------
-- Preflight checks
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION mm_is_valid_json(input_text text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN true;
  END IF;

  PERFORM input_text::jsonb;
  RETURN true;
EXCEPTION WHEN others THEN
  RETURN false;
END;
$$;

-- Optional foreign keys may contain empty strings from legacy forms. Normalize
-- them before validating relations and adding foreign key constraints.
UPDATE "Invoice" SET "guardianId" = NULL WHERE "guardianId" = '';
UPDATE "ChildPhoto" SET "groupId" = NULL WHERE "groupId" = '';
UPDATE "Announcement" SET "groupId" = NULL WHERE "groupId" = '';
UPDATE "CalendarEvent" SET "groupId" = NULL WHERE "groupId" = '';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Payment" p
    LEFT JOIN "Invoice" i ON i.id = p."invoiceId"
    WHERE i.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Preflight failed: Payment rows exist without a valid Invoice.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Invoice" i
    LEFT JOIN "Guardian" g ON g.id = i."guardianId"
    WHERE i."guardianId" IS NOT NULL
      AND g.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Preflight failed: Invoice.guardianId contains orphan references.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "ChildPhoto" p
    LEFT JOIN "Group" g ON g.id = p."groupId"
    WHERE p."groupId" IS NOT NULL
      AND g.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Preflight failed: ChildPhoto.groupId contains orphan references.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Announcement" a
    LEFT JOIN "Group" g ON g.id = a."groupId"
    WHERE a."groupId" IS NOT NULL
      AND g.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Preflight failed: Announcement.groupId contains orphan references.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "CalendarEvent" e
    LEFT JOIN "Group" g ON g.id = e."groupId"
    WHERE e."groupId" IS NOT NULL
      AND g.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Preflight failed: CalendarEvent.groupId contains orphan references.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "PrivacyConsent" pc
    LEFT JOIN "User" u ON u.id = pc."userId"
    WHERE u.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Preflight failed: PrivacyConsent.userId contains orphan references.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Payment"
    WHERE NOT mm_is_valid_json("webhookData")
  ) THEN
    RAISE EXCEPTION 'Preflight failed: Payment.webhookData contains invalid JSON.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Add nullable columns first, then backfill and validate.
-- ---------------------------------------------------------------------------

ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "Guardian" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "Staff" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "userId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "whatsapp" TEXT,
  "cpf" TEXT,
  "birthDate" TIMESTAMP(3),
  "photoUrl" TEXT,
  "roleType" TEXT NOT NULL DEFAULT 'TEACHER',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "admissionDate" TIMESTAMP(3),
  "notes" TEXT,
  "baseSalary" DECIMAL(10,2),
  "paymentDay" INTEGER,
  "pixKey" TEXT,
  "bankName" TEXT,
  "bankAgency" TEXT,
  "bankAccount" TEXT,
  "financialNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

ALTER TABLE "ChildDailyReport" ADD COLUMN IF NOT EXISTS "dateKey" TEXT;
ALTER TABLE "ChildCheckInOut" ADD COLUMN IF NOT EXISTS "dateKey" TEXT;

UPDATE "ChildDailyReport"
SET "dateKey" = to_char("date", 'YYYY-MM-DD')
WHERE "dateKey" IS DISTINCT FROM to_char("date", 'YYYY-MM-DD');

UPDATE "ChildCheckInOut"
SET "dateKey" = to_char("date", 'YYYY-MM-DD')
WHERE "dateKey" IS DISTINCT FROM to_char("date", 'YYYY-MM-DD');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT "childId", "dateKey", COUNT(*) AS total
      FROM "ChildDailyReport"
      WHERE "dateKey" IS NOT NULL
      GROUP BY "childId", "dateKey"
      HAVING COUNT(*) > 1
    ) duplicates
  ) THEN
    RAISE EXCEPTION 'Preflight failed: duplicate ChildDailyReport rows for childId + dateKey.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT "childId", "dateKey", COUNT(*) AS total
      FROM "ChildCheckInOut"
      WHERE "dateKey" IS NOT NULL
      GROUP BY "childId", "dateKey"
      HAVING COUNT(*) > 1
    ) duplicates
  ) THEN
    RAISE EXCEPTION 'Preflight failed: duplicate ChildCheckInOut rows for childId + dateKey.';
  END IF;
END $$;

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "gateway" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "gatewayPaymentId" TEXT;

UPDATE "Payment" p
SET "schoolId" = i."schoolId"
FROM "Invoice" i
WHERE p."invoiceId" = i.id
  AND p."schoolId" IS NULL;

UPDATE "Payment"
SET
  "gateway" = 'MERCADO_PAGO',
  "gatewayPaymentId" = "mpPaymentId"
WHERE "mpPaymentId" IS NOT NULL
  AND ("gateway" IS NULL OR "gatewayPaymentId" IS NULL);

UPDATE "Payment"
SET "gateway" = 'MANUAL'
WHERE "gateway" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Payment" WHERE "schoolId" IS NULL) THEN
    RAISE EXCEPTION 'Backfill failed: Payment.schoolId could not be filled from Invoice.schoolId.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT "gateway", "gatewayPaymentId", COUNT(*) AS total
      FROM "Payment"
      WHERE "gateway" IS NOT NULL
        AND "gatewayPaymentId" IS NOT NULL
      GROUP BY "gateway", "gatewayPaymentId"
      HAVING COUNT(*) > 1
    ) duplicates
  ) THEN
    RAISE EXCEPTION 'Preflight failed: duplicate Payment gateway + gatewayPaymentId rows.';
  END IF;
END $$;

ALTER TABLE "Payment" ALTER COLUMN "schoolId" SET NOT NULL;

-- ---------------------------------------------------------------------------
-- Staff/payroll tables may be missing in databases created before the staff
-- module existed. Create them with the current shape when absent.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "Staff" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "userId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "whatsapp" TEXT,
  "cpf" TEXT,
  "birthDate" TIMESTAMP(3),
  "photoUrl" TEXT,
  "roleType" TEXT NOT NULL DEFAULT 'TEACHER',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "admissionDate" TIMESTAMP(3),
  "notes" TEXT,
  "baseSalary" DECIMAL(10,2),
  "paymentDay" INTEGER,
  "pixKey" TEXT,
  "bankName" TEXT,
  "bankAgency" TEXT,
  "bankAccount" TEXT,
  "financialNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StaffGroupAssignment" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "assignmentType" TEXT NOT NULL DEFAULT 'MAIN_TEACHER',
  "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffGroupAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StaffPayment" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "referenceMonth" INTEGER NOT NULL,
  "referenceYear" INTEGER NOT NULL,
  "baseSalary" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "totalBonuses" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "totalDeductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "finalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "paymentDate" TIMESTAMP(3),
  "paymentMethod" TEXT,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StaffPaymentBonus" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "staffPaymentId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "amount" DECIMAL(10,2) NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'MANUAL',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffPaymentBonus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StaffPaymentDeduction" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "staffPaymentId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "amount" DECIMAL(10,2) NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'DISCOUNT',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffPaymentDeduction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StaffAuditLog" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "staffId" TEXT,
  "paymentId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "before" TEXT,
  "after" TEXT,
  "performedBy" TEXT NOT NULL,
  "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffAuditLog_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- Type changes
-- ---------------------------------------------------------------------------

ALTER TABLE "Child" ALTER COLUMN "monthlyFee" TYPE DECIMAL(10,2) USING "monthlyFee"::DECIMAL(10,2);
ALTER TABLE "Student" ALTER COLUMN "monthlyFee" TYPE DECIMAL(10,2) USING "monthlyFee"::DECIMAL(10,2);
ALTER TABLE "Invoice" ALTER COLUMN "amount" TYPE DECIMAL(10,2) USING "amount"::DECIMAL(10,2);
ALTER TABLE "Invoice" ALTER COLUMN "paidAmount" TYPE DECIMAL(10,2) USING "paidAmount"::DECIMAL(10,2);
ALTER TABLE "Payment" ALTER COLUMN "amount" TYPE DECIMAL(10,2) USING "amount"::DECIMAL(10,2);
ALTER TABLE "Staff" ALTER COLUMN "baseSalary" TYPE DECIMAL(10,2) USING "baseSalary"::DECIMAL(10,2);
ALTER TABLE "StaffPayment" ALTER COLUMN "baseSalary" TYPE DECIMAL(10,2) USING "baseSalary"::DECIMAL(10,2);
ALTER TABLE "StaffPayment" ALTER COLUMN "totalBonuses" TYPE DECIMAL(10,2) USING "totalBonuses"::DECIMAL(10,2);
ALTER TABLE "StaffPayment" ALTER COLUMN "totalDeductions" TYPE DECIMAL(10,2) USING "totalDeductions"::DECIMAL(10,2);
ALTER TABLE "StaffPayment" ALTER COLUMN "finalAmount" TYPE DECIMAL(10,2) USING "finalAmount"::DECIMAL(10,2);
ALTER TABLE "StaffPaymentBonus" ALTER COLUMN "amount" TYPE DECIMAL(10,2) USING "amount"::DECIMAL(10,2);
ALTER TABLE "StaffPaymentDeduction" ALTER COLUMN "amount" TYPE DECIMAL(10,2) USING "amount"::DECIMAL(10,2);

ALTER TABLE "Payment" ALTER COLUMN "webhookData" TYPE JSONB USING "webhookData"::jsonb;

DROP FUNCTION mm_is_valid_json(text);

-- ---------------------------------------------------------------------------
-- New audit/tracking tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "PaymentWebhookEvent" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT,
  "invoiceId" TEXT,
  "paymentId" TEXT,
  "gateway" TEXT NOT NULL DEFAULT 'MERCADO_PAGO',
  "eventType" TEXT,
  "externalId" TEXT,
  "rawPayload" JSONB NOT NULL,
  "processedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WhatsAppMessage" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "recipientName" TEXT,
  "type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "error" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- Constraints
-- ---------------------------------------------------------------------------

ALTER TABLE "ChildDailyReport" DROP CONSTRAINT IF EXISTS "ChildDailyReport_childId_date_key";
ALTER TABLE "ChildCheckInOut" DROP CONSTRAINT IF EXISTS "ChildCheckInOut_childId_date_key";
ALTER TABLE "StaffGroupAssignment" DROP CONSTRAINT IF EXISTS "StaffGroupAssignment_staffId_groupId_key";
DROP INDEX IF EXISTS "ChildDailyReport_childId_date_key";
DROP INDEX IF EXISTS "ChildCheckInOut_childId_date_key";

ALTER TABLE "ChildDailyReport"
  ADD CONSTRAINT "ChildDailyReport_childId_dateKey_key" UNIQUE ("childId", "dateKey");

ALTER TABLE "ChildCheckInOut"
  ADD CONSTRAINT "ChildCheckInOut_childId_dateKey_key" UNIQUE ("childId", "dateKey");

ALTER TABLE "StaffGroupAssignment"
  ADD CONSTRAINT "StaffGroupAssignment_staffId_groupId_startDate_key" UNIQUE ("staffId", "groupId", "startDate");

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_gateway_gatewayPaymentId_key" UNIQUE ("gateway", "gatewayPaymentId");

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChildPhoto"
  ADD CONSTRAINT "ChildPhoto_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Announcement"
  ADD CONSTRAINT "Announcement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CalendarEvent"
  ADD CONSTRAINT "CalendarEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PrivacyConsent"
  ADD CONSTRAINT "PrivacyConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentWebhookEvent"
  ADD CONSTRAINT "PaymentWebhookEvent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentWebhookEvent"
  ADD CONSTRAINT "PaymentWebhookEvent_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentWebhookEvent"
  ADD CONSTRAINT "PaymentWebhookEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WhatsAppMessage"
  ADD CONSTRAINT "WhatsAppMessage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Staff_schoolId_fkey') THEN
    ALTER TABLE "Staff" ADD CONSTRAINT "Staff_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Staff_userId_fkey') THEN
    ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffGroupAssignment_staffId_fkey') THEN
    ALTER TABLE "StaffGroupAssignment" ADD CONSTRAINT "StaffGroupAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffGroupAssignment_groupId_fkey') THEN
    ALTER TABLE "StaffGroupAssignment" ADD CONSTRAINT "StaffGroupAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffPayment_schoolId_fkey') THEN
    ALTER TABLE "StaffPayment" ADD CONSTRAINT "StaffPayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffPayment_staffId_fkey') THEN
    ALTER TABLE "StaffPayment" ADD CONSTRAINT "StaffPayment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffPaymentBonus_staffPaymentId_fkey') THEN
    ALTER TABLE "StaffPaymentBonus" ADD CONSTRAINT "StaffPaymentBonus_staffPaymentId_fkey" FOREIGN KEY ("staffPaymentId") REFERENCES "StaffPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffPaymentBonus_staffId_fkey') THEN
    ALTER TABLE "StaffPaymentBonus" ADD CONSTRAINT "StaffPaymentBonus_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffPaymentDeduction_staffPaymentId_fkey') THEN
    ALTER TABLE "StaffPaymentDeduction" ADD CONSTRAINT "StaffPaymentDeduction_staffPaymentId_fkey" FOREIGN KEY ("staffPaymentId") REFERENCES "StaffPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffPaymentDeduction_staffId_fkey') THEN
    ALTER TABLE "StaffPaymentDeduction" ADD CONSTRAINT "StaffPaymentDeduction_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Staff" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "StaffGroupAssignment" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "StaffPayment" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "StaffPaymentBonus" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "StaffPaymentDeduction" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "User_schoolId_idx" ON "User"("schoolId");
CREATE INDEX IF NOT EXISTS "User_schoolId_role_idx" ON "User"("schoolId", "role");
CREATE INDEX IF NOT EXISTS "User_schoolId_active_idx" ON "User"("schoolId", "active");

CREATE INDEX IF NOT EXISTS "Group_schoolId_idx" ON "Group"("schoolId");
CREATE INDEX IF NOT EXISTS "Group_schoolId_active_idx" ON "Group"("schoolId", "active");

CREATE INDEX IF NOT EXISTS "Child_schoolId_idx" ON "Child"("schoolId");
CREATE INDEX IF NOT EXISTS "Child_schoolId_status_idx" ON "Child"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "Child_schoolId_groupId_idx" ON "Child"("schoolId", "groupId");
CREATE INDEX IF NOT EXISTS "Child_schoolId_registrationNumber_idx" ON "Child"("schoolId", "registrationNumber");

CREATE INDEX IF NOT EXISTS "Student_schoolId_idx" ON "Student"("schoolId");
CREATE INDEX IF NOT EXISTS "Student_schoolId_status_idx" ON "Student"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "Student_schoolId_groupId_idx" ON "Student"("schoolId", "groupId");
CREATE INDEX IF NOT EXISTS "Student_schoolId_registrationNumber_idx" ON "Student"("schoolId", "registrationNumber");

CREATE INDEX IF NOT EXISTS "Guardian_schoolId_idx" ON "Guardian"("schoolId");
CREATE INDEX IF NOT EXISTS "Guardian_schoolId_phone_idx" ON "Guardian"("schoolId", "phone");
CREATE INDEX IF NOT EXISTS "Guardian_schoolId_email_idx" ON "Guardian"("schoolId", "email");
CREATE INDEX IF NOT EXISTS "Guardian_schoolId_cpf_idx" ON "Guardian"("schoolId", "cpf");

CREATE INDEX IF NOT EXISTS "ChildDailyReport_schoolId_date_idx" ON "ChildDailyReport"("schoolId", "date");
CREATE INDEX IF NOT EXISTS "ChildDailyReport_childId_date_idx" ON "ChildDailyReport"("childId", "date");
CREATE INDEX IF NOT EXISTS "ChildDailyReport_childId_dateKey_idx" ON "ChildDailyReport"("childId", "dateKey");

CREATE INDEX IF NOT EXISTS "ChildCheckInOut_schoolId_date_idx" ON "ChildCheckInOut"("schoolId", "date");
CREATE INDEX IF NOT EXISTS "ChildCheckInOut_childId_date_idx" ON "ChildCheckInOut"("childId", "date");
CREATE INDEX IF NOT EXISTS "ChildCheckInOut_childId_dateKey_idx" ON "ChildCheckInOut"("childId", "dateKey");
CREATE INDEX IF NOT EXISTS "ChildCheckInOut_schoolId_status_idx" ON "ChildCheckInOut"("schoolId", "status");

CREATE INDEX IF NOT EXISTS "ChildPhoto_schoolId_date_idx" ON "ChildPhoto"("schoolId", "date");
CREATE INDEX IF NOT EXISTS "ChildPhoto_schoolId_groupId_idx" ON "ChildPhoto"("schoolId", "groupId");
CREATE INDEX IF NOT EXISTS "ChildPhoto_childId_idx" ON "ChildPhoto"("childId");

CREATE INDEX IF NOT EXISTS "Announcement_schoolId_idx" ON "Announcement"("schoolId");
CREATE INDEX IF NOT EXISTS "Announcement_schoolId_groupId_idx" ON "Announcement"("schoolId", "groupId");
CREATE INDEX IF NOT EXISTS "Announcement_schoolId_createdAt_idx" ON "Announcement"("schoolId", "createdAt");

CREATE INDEX IF NOT EXISTS "CalendarEvent_schoolId_idx" ON "CalendarEvent"("schoolId");
CREATE INDEX IF NOT EXISTS "CalendarEvent_schoolId_date_idx" ON "CalendarEvent"("schoolId", "date");
CREATE INDEX IF NOT EXISTS "CalendarEvent_schoolId_groupId_idx" ON "CalendarEvent"("schoolId", "groupId");

CREATE INDEX IF NOT EXISTS "Invoice_schoolId_idx" ON "Invoice"("schoolId");
CREATE INDEX IF NOT EXISTS "Invoice_schoolId_status_idx" ON "Invoice"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "Invoice_schoolId_dueDate_idx" ON "Invoice"("schoolId", "dueDate");
CREATE INDEX IF NOT EXISTS "Invoice_schoolId_referenceMonth_idx" ON "Invoice"("schoolId", "referenceMonth");
CREATE INDEX IF NOT EXISTS "Invoice_childId_idx" ON "Invoice"("childId");
CREATE INDEX IF NOT EXISTS "Invoice_studentId_idx" ON "Invoice"("studentId");
CREATE INDEX IF NOT EXISTS "Invoice_guardianId_idx" ON "Invoice"("guardianId");

CREATE INDEX IF NOT EXISTS "Payment_schoolId_idx" ON "Payment"("schoolId");
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX IF NOT EXISTS "Payment_gateway_gatewayPaymentId_idx" ON "Payment"("gateway", "gatewayPaymentId");

CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_schoolId_idx" ON "PaymentWebhookEvent"("schoolId");
CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_gateway_externalId_idx" ON "PaymentWebhookEvent"("gateway", "externalId");
CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_status_idx" ON "PaymentWebhookEvent"("status");
CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_createdAt_idx" ON "PaymentWebhookEvent"("createdAt");

CREATE INDEX IF NOT EXISTS "WhatsAppMessage_schoolId_status_idx" ON "WhatsAppMessage"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "WhatsAppMessage_schoolId_createdAt_idx" ON "WhatsAppMessage"("schoolId", "createdAt");
CREATE INDEX IF NOT EXISTS "WhatsAppMessage_to_idx" ON "WhatsAppMessage"("to");

CREATE INDEX IF NOT EXISTS "Staff_schoolId_idx" ON "Staff"("schoolId");
CREATE INDEX IF NOT EXISTS "Staff_schoolId_status_idx" ON "Staff"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "Staff_schoolId_roleType_idx" ON "Staff"("schoolId", "roleType");
CREATE UNIQUE INDEX IF NOT EXISTS "Staff_userId_key" ON "Staff"("userId");

CREATE INDEX IF NOT EXISTS "StaffGroupAssignment_schoolId_staffId_idx" ON "StaffGroupAssignment"("schoolId", "staffId");
CREATE INDEX IF NOT EXISTS "StaffGroupAssignment_schoolId_groupId_idx" ON "StaffGroupAssignment"("schoolId", "groupId");
CREATE INDEX IF NOT EXISTS "StaffGroupAssignment_staffId_groupId_status_idx" ON "StaffGroupAssignment"("staffId", "groupId", "status");

CREATE INDEX IF NOT EXISTS "StaffPayment_schoolId_idx" ON "StaffPayment"("schoolId");
CREATE INDEX IF NOT EXISTS "StaffPayment_staffId_idx" ON "StaffPayment"("staffId");
CREATE INDEX IF NOT EXISTS "StaffPayment_schoolId_referenceYear_referenceMonth_idx" ON "StaffPayment"("schoolId", "referenceYear", "referenceMonth");
CREATE INDEX IF NOT EXISTS "StaffPayment_schoolId_status_idx" ON "StaffPayment"("schoolId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "StaffPayment_staffId_referenceMonth_referenceYear_key" ON "StaffPayment"("staffId", "referenceMonth", "referenceYear");

CREATE INDEX IF NOT EXISTS "StaffPaymentBonus_schoolId_idx" ON "StaffPaymentBonus"("schoolId");
CREATE INDEX IF NOT EXISTS "StaffPaymentBonus_staffId_idx" ON "StaffPaymentBonus"("staffId");
CREATE INDEX IF NOT EXISTS "StaffPaymentBonus_staffPaymentId_idx" ON "StaffPaymentBonus"("staffPaymentId");

CREATE INDEX IF NOT EXISTS "StaffPaymentDeduction_schoolId_idx" ON "StaffPaymentDeduction"("schoolId");
CREATE INDEX IF NOT EXISTS "StaffPaymentDeduction_staffId_idx" ON "StaffPaymentDeduction"("staffId");
CREATE INDEX IF NOT EXISTS "StaffPaymentDeduction_staffPaymentId_idx" ON "StaffPaymentDeduction"("staffPaymentId");

CREATE INDEX IF NOT EXISTS "StaffAuditLog_schoolId_idx" ON "StaffAuditLog"("schoolId");
CREATE INDEX IF NOT EXISTS "StaffAuditLog_staffId_idx" ON "StaffAuditLog"("staffId");
CREATE INDEX IF NOT EXISTS "StaffAuditLog_paymentId_idx" ON "StaffAuditLog"("paymentId");
CREATE INDEX IF NOT EXISTS "StaffAuditLog_performedBy_idx" ON "StaffAuditLog"("performedBy");
CREATE INDEX IF NOT EXISTS "StaffAuditLog_performedAt_idx" ON "StaffAuditLog"("performedAt");
