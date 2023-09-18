import { Prisma, prisma } from "@/lib/prisma";

const findRevisionsByDocumentId = async (documentId: string) => {
  return prisma.revision.findMany({
    where: { documentId },
    select: {
      id: true,
      createdAt: true,
      data: true,
      author: {
        select: {
          id: true,
          handle: true,
          name: true,
          image: true,
          email: true,
          role: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

const findRevisionsByAuthorId = async (authorId: string) => {
  return prisma.revision.findMany({
    where: { authorId },
    select: {
      id: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          handle: true,
          name: true,
          image: true,
          email: true,
          role: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

const findRevisionById = async (id: string) => {
  return prisma.revision.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      data: true,
      author: {
        select: {
          id: true,
          handle: true,
          name: true,
          image: true,
          email: true,
          role: true,
        }
      }
    }
  });
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
  findRevisionsByDocumentId,
  findRevisionsByAuthorId,
  findRevisionById,
  findRevisionAuthorId,
  createRevision,
  updateRevision,
  deleteRevision,
};