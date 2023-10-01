import { Prisma, prisma } from "@/lib/prisma";
import { EditorDocumentRevision } from "@/types";

const findRevisionById = async (id: string) => {
  const revision = await prisma.revision.findUnique({
    where: { id },
    select: {
      id: true,
      documentId: true,
      createdAt: true,
      data: true,
    }
  });
  if (!revision) return null;
  const DocumentRevision: EditorDocumentRevision = {
    ...revision,
    data: revision.data as unknown as EditorDocumentRevision["data"],
  };
  return DocumentRevision as EditorDocumentRevision;
}

const findRevisionAuthorId = async (id: string) => {
  const revision = await prisma.revision.findUnique({
    where: { id },
    select: {
      authorId: true,
    }
  });
  return revision?.authorId;
}

const createRevision = async (data: Prisma.RevisionUncheckedCreateInput) => {
  return prisma.revision.create({ data });
}

const updateRevision = async (id: string, data: Prisma.RevisionUpdateInput) => {
  return prisma.revision.update({
    where: { id },
    data
  });
}

const deleteRevision = async (id: string) => {
  return prisma.revision.delete({
    where: { id },
  });
}

export {
  findRevisionById,
  findRevisionAuthorId,
  createRevision,
  updateRevision,
  deleteRevision,
};