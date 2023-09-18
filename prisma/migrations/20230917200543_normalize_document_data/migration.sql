/*
  Warnings:

  - You are about to drop the column `data` on the `documents` table. All the data in the column will be lost.
  - Added the required column `head` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" ADD COLUMN "head" UUID;

-- CreateTable
CREATE TABLE "revisions" (
    "id" UUID NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "document_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,

    CONSTRAINT "revisions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- insert data from documents into revisions
INSERT INTO "revisions" ("id", "data", "document_id", "author_id", "created_at") SELECT gen_random_uuid(), "data", "id", "author_id", "updated_at" FROM "documents";

-- set head to revision id
UPDATE "documents" SET "head" = "revisions"."id" FROM "revisions" WHERE "documents"."id" = "revisions"."document_id";

-- drop column
ALTER TABLE "documents" DROP COLUMN "data";