import { Prisma, prisma } from "@/lib/prisma";

const findAllDocuments = async () => {
  return prisma.document.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          role: true,
        }
      },
      published: true,
      baseId: true,
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });
}

const findDocumentsByAuthorId = async (authorId: string) => {
  return prisma.document.findMany({
    where: { authorId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      published: true,
      baseId: true,
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });
}

const findPuplishedDocumentsByAuthorId = async (authorId: string) => {
  return prisma.document.findMany({
    where: { authorId, published: true },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      published: true,
      baseId: true,
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
      baseId: true,
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
          image: true,
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

export { findAllDocuments, findDocumentsByAuthorId, findPuplishedDocumentsByAuthorId, findDocumentById, findDocumentAuthorId, findDocumentMetadata, createDocument, updateDocument, deleteDocument };