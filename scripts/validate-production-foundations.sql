-- Validation script for migration 20260519032000_production_foundations.
-- Run after applying the migration in staging/production.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Payment" WHERE "schoolId" IS NULL) THEN
    RAISE EXCEPTION 'Validation failed: Payment.schoolId has NULL rows.';
  END IF;

  IF EXISTS (SELECT 1 FROM "ChildDailyReport" WHERE "dateKey" IS NULL) THEN
    RAISE EXCEPTION 'Validation failed: ChildDailyReport.dateKey has NULL rows.';
  END IF;

  IF EXISTS (SELECT 1 FROM "ChildCheckInOut" WHERE "dateKey" IS NULL) THEN
    RAISE EXCEPTION 'Validation failed: ChildCheckInOut.dateKey has NULL rows.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT "childId", "dateKey", COUNT(*) AS total
      FROM "ChildDailyReport"
      GROUP BY "childId", "dateKey"
      HAVING COUNT(*) > 1
    ) duplicates
  ) THEN
    RAISE EXCEPTION 'Validation failed: duplicate ChildDailyReport childId + dateKey.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT "childId", "dateKey", COUNT(*) AS total
      FROM "ChildCheckInOut"
      GROUP BY "childId", "dateKey"
      HAVING COUNT(*) > 1
    ) duplicates
  ) THEN
    RAISE EXCEPTION 'Validation failed: duplicate ChildCheckInOut childId + dateKey.';
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
    RAISE EXCEPTION 'Validation failed: duplicate Payment gateway + gatewayPaymentId.';
  END IF;

  IF to_regclass('"PaymentWebhookEvent"') IS NULL THEN
    RAISE EXCEPTION 'Validation failed: PaymentWebhookEvent table is missing.';
  END IF;

  IF to_regclass('"WhatsAppMessage"') IS NULL THEN
    RAISE EXCEPTION 'Validation failed: WhatsAppMessage table is missing.';
  END IF;
END $$;

SELECT
  (SELECT COUNT(*) FROM "Payment") AS payments,
  (SELECT COUNT(*) FROM "Payment" WHERE "schoolId" IS NOT NULL) AS payments_with_school,
  (SELECT COUNT(*) FROM "ChildDailyReport") AS daily_reports,
  (SELECT COUNT(*) FROM "ChildCheckInOut") AS check_in_outs,
  (SELECT COUNT(*) FROM "PaymentWebhookEvent") AS payment_webhook_events,
  (SELECT COUNT(*) FROM "WhatsAppMessage") AS whatsapp_messages;
