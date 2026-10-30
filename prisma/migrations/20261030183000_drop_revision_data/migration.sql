-- AlterTable
UPDATE "Revision" SET "size" = 0 WHERE "size" IS NULL;
ALTER TABLE "Revision" DROP COLUMN "data",
ALTER COLUMN "size" SET NOT NULL,
ALTER COLUMN "size" SET DEFAULT 0;
