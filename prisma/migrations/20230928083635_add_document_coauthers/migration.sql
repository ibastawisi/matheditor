-- CreateTable
CREATE TABLE "DocumentCoauthers" (
    "document_id" UUID NOT NULL,
    "user_email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentCoauthers_pkey" PRIMARY KEY ("document_id","user_email")
);

-- AddForeignKey
ALTER TABLE "DocumentCoauthers" ADD CONSTRAINT "DocumentCoauthers_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentCoauthers" ADD CONSTRAINT "DocumentCoauthers_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE CASCADE;
