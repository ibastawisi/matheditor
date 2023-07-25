-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_user_id_fkey";

-- AlterTable
ALTER TABLE "documents" RENAME COLUMN "user_id" TO "author_id";

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
