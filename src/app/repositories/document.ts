import { Prisma, prisma } from "@/app/prisma";

const findAllDocuments = async () => {
  return prisma.document.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      isPublic: true,
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });
}

const findDocumentById = async (id: string) => {
  return prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      data: true,
    }
  });
}

const findDocumentAuthorId = async (id: string) => {
  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      authorId: true,
    }
  });
  return document?.authorId;
}

const findDocumentMetadata = async (id: string) => {
  return prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          name: true,
          picture: true,
          email: true,
        }
      }
    }
  });
}

const createDocument = async (data: Prisma.DocumentCreateInput) => {
  return prisma.document.create({ data });
}

const updateDocument = async (id: string, data: Prisma.DocumentUpdateInput) => {
  return prisma.document.update({
    where: { id },
    data
  });
}

const deleteDocument = async (id: string) => {
  return prisma.document.delete({
    where: { id },
  });
}

const getDocumentsCount = async () => {
  return prisma.document.count();
}

const getLatestDocuments = async () => {
  return prisma.document.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 5
  });
}

export { findAllDocuments, findDocumentById, findDocumentAuthorId, findDocumentMetadata, createDocument, updateDocument, deleteDocument, getDocumentsCount, getLatestDocuments };