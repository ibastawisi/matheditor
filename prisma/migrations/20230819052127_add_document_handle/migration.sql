/*
  Warnings:

  - A unique constraint covering the columns `[handle]` on the table `documents` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "handle" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "documents_handle_key" ON "documents"("handle");
