-- CreateTable
CREATE TABLE "CollabState" (
    "documentId" UUID NOT NULL,
    "data" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollabState_pkey" PRIMARY KEY ("documentId")
);

-- AddForeignKey
ALTER TABLE "CollabState" ADD CONSTRAINT "CollabState_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
