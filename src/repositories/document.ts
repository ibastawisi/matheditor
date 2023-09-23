import { Prisma, prisma } from "@/lib/prisma";

const findAllDocuments = async () => {
  return prisma.document.findMany({
    select: {
      id: true,
      handle: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      author: true,
      published: true,
      baseId: true,
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });
}

const findPublishedDocuments = async () => {
  return prisma.document.findMany({
    where: { published: true },
    select: {
      id: true,
      handle: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      published: true,
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
      updatedAt: 'desc'
    }
  });
}

const findDocumentsByAuthorId = async (authorId: string) => {
  return prisma.document.findMany({
    where: { authorId },
    select: {
      id: true,
      handle: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      published: true,
      baseId: true,
      head: true,
      revisions: {
        select: {
          id: true,
          documentId: true,
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
      },
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
      updatedAt: 'desc'
    }
  });
}

const findPublishedDocumentsByAuthorId = async (authorId: string) => {
  return prisma.document.findMany({
    where: { authorId, published: true },
    select: {
      id: true,
      handle: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      published: true,
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
      updatedAt: 'desc'
    }
  });
}

const findDocumentById = async (id: string) => {
  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      handle: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      published: true,
      baseId: true,
      head: true,
      revisions: {
        select: {
          id: true,
          documentId: true,
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
      },
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
  });

  const head = document?.head;
  if (!head) return document;
  const revision = await prisma.revision.findUnique({ where: { id: head }, select: { data: true } });
  return { ...document, data: revision?.data };
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

const findUserDocument = async (id: string) => {
  return prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      handle: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      published: true,
      baseId: true,
      head: true,
      revisions: {
        select: {
          id: true,
          documentId: true,
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
      },
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

const findDocumentIdByHandle = async (handle: string) => {
  const document = await prisma.document.findUnique({
    where: { handle: handle.toLowerCase() },
    select: {
      id: true,
    }
  });
  return document?.id;
}

const checkHandleAvailability = async (handle: string) => {
  const documentId = await findDocumentIdByHandle(handle.toLowerCase());
  return !documentId;
}

export {
  findAllDocuments,
  findPublishedDocuments,
  findDocumentsByAuthorId,
  findPublishedDocumentsByAuthorId,
  findDocumentById,
  findDocumentAuthorId,
  findUserDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  findDocumentIdByHandle,
  checkHandleAvailability
};