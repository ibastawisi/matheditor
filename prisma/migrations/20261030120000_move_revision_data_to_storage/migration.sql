-- Revision data moves to object storage, the column is kept until every revision is migrated
ALTER TABLE "Revision" ALTER COLUMN "data" DROP NOT NULL;

-- The size of the data in object storage, null while the data is still in the database
ALTER TABLE "Revision" ADD COLUMN "size" INTEGER;
