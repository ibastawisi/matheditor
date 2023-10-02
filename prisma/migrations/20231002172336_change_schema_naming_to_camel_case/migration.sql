-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_user_id_fkey";

-- DropForeignKey
ALTER TABLE "DocumentCoauthers" DROP CONSTRAINT "DocumentCoauthers_document_id_fkey";

-- DropForeignKey
ALTER TABLE "DocumentCoauthers" DROP CONSTRAINT "DocumentCoauthers_user_email_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_user_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_author_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_base_id_fkey";

-- DropForeignKey
ALTER TABLE "revisions" DROP CONSTRAINT "revisions_author_id_fkey";

-- DropForeignKey
ALTER TABLE "revisions" DROP CONSTRAINT "revisions_document_id_fkey";

-- DropIndex
DROP INDEX "Account_provider_provider_account_id_key";

-- DropIndex
DROP INDEX "Session_session_token_key";

-- AlterTable
ALTER TABLE "Account" RENAME COLUMN "provider_account_id" TO "providerAccountId";
ALTER TABLE "Account" RENAME COLUMN "user_id" TO "userId";

-- AlterTable
ALTER TABLE "DocumentCoauthers" DROP CONSTRAINT "DocumentCoauthers_pkey";
ALTER TABLE "DocumentCoauthers" RENAME COLUMN "document_id" TO "documentId";
ALTER TABLE "DocumentCoauthers" RENAME COLUMN "user_email" TO "userEmail";
ALTER TABLE "DocumentCoauthers" ADD CONSTRAINT "DocumentCoauthers_pkey" PRIMARY KEY ("documentId", "userEmail");

-- AlterTable
ALTER TABLE "Session" RENAME COLUMN "session_token" TO "sessionToken";
ALTER TABLE "Session" RENAME COLUMN "user_id" TO "userId";

-- AlterTable
ALTER TABLE "documents" RENAME TO "Document";
ALTER TABLE "Document" RENAME COLUMN "author_id" TO "authorId";
ALTER TABLE "Document" RENAME COLUMN "base_id" TO "baseId";
ALTER TABLE "Document" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "Document" RENAME COLUMN "updated_at" TO "updatedAt";

-- AlterTable
ALTER TABLE "revisions" RENAME TO "Revision";
ALTER TABLE "Revision" RENAME COLUMN "author_id" TO "authorId";
ALTER TABLE "Revision" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "Revision" RENAME COLUMN "document_id" TO "documentId";

-- AlterTable
ALTER TABLE "users" RENAME TO "User";
ALTER TABLE "User" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "User" RENAME COLUMN "updated_at" TO "updatedAt";

-- AlterTable
ALTER TABLE "Document" RENAME CONSTRAINT "documents_pkey" TO "Document_pkey";

-- AlterTable
ALTER TABLE "Revision" RENAME CONSTRAINT "revisions_pkey" TO "Revision_pkey";

-- AlterTable
ALTER TABLE "User" RENAME CONSTRAINT "users_pkey" TO "User_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "Document_handle_key" ON "Document"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentCoauthers" ADD CONSTRAINT "DocumentCoauthers_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentCoauthers" ADD CONSTRAINT "DocumentCoauthers_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
