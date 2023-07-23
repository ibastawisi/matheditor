-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "base_id" UUID;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
