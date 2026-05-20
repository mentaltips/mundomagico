-- Add missing columns to Announcement table
-- These fields exist in schema.prisma but were never added via migration,
-- causing 500 errors on GET /api/announcements (Prisma queries isPinned and active).

ALTER TABLE "Announcement"
  ADD COLUMN IF NOT EXISTS "active"    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "isPinned"  BOOLEAN NOT NULL DEFAULT false;

-- Mark any rows created before this migration as active
UPDATE "Announcement" SET "active" = true WHERE "active" IS NULL;
