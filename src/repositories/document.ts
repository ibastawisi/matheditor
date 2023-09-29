import { Prisma, prisma } from "@/lib/prisma";
import { CloudDocument, EditorDocument } from "@/types";
import { findUserCoauthoredDocuments } from "./user";

const findAllDocuments = async () => {
  const documents = await prisma.document.findMany({
    where: { published: true },
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
        }
      },
      coauthors: {
        select: {
          user: {
            select: {
              id: true,
              handle: true,
              name: true,
              image: true,
              email: true,
            }
          }
        },
        orderBy: {
          created_at: 'asc'
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  const cloudDocuments = documents.map((document) => {
    const cloudDocument: CloudDocument = {
      ...document,
      coauthors: document.coauthors.map((coauthor) => coauthor.user),
    };
    return cloudDocument;
  });
  return cloudDocuments;  
}

const findPublishedDocuments = async () => {
  const documents = await prisma.document.findMany({
    where: { published: true },
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
        }
      },
      coauthors: {
        select: {
          user: {
            select: {
              id: true,
              handle: true,
              name: true,
              image: true,
              email: true,
            }
          }
        },
        orderBy: {
          created_at: 'asc'
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  const cloudDocuments = documents.map((document) => {
    const cloudDocument: CloudDocument = {
      ...document,
        coauthors: document.coauthors.map((coauthor) => coauthor.user),
      revisions: document.revisions.filter((revision) => revision.id === document.head)
    };
    return cloudDocument;
  });
  return cloudDocuments;
}

const findDocumentsByAuthorId = async (authorId: string) => {
  const documents = await prisma.document.findMany({
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
        }
      },
      coauthors: {
        select: {
          user: {
            select: {
              id: true,
              handle: true,
              name: true,
              image: true,
              email: true,
            }
          }
        },
        orderBy: {
          created_at: 'asc'
        }
      },
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  const authoredDocuments = documents.map((document) => {
    const cloudDocument: CloudDocument = {
      ...document,
        coauthors: document.coauthors.map((coauthor) => coauthor.user),
    };
    return cloudDocument;
  });
  const coauthoredDocuments = await findUserCoauthoredDocuments(authorId);
  return [...authoredDocuments, ...coauthoredDocuments].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

const findPublishedDocumentsByAuthorId = async (authorId: string) => {
  const documents = await prisma.document.findMany({
    where: { authorId, published: true },
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
        }
      },
      coauthors: {
        select: {
          user: {
            select: {
              id: true,
              handle: true,
              name: true,
              image: true,
              email: true,
            }
          }
        },
        orderBy: {
          created_at: 'asc'
        }
      },
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  const cloudDocuments = documents.map((document) => {
    const cloudDocument: CloudDocument = {
      ...document,
        coauthors: document.coauthors.map((coauthor) => coauthor.user),
      revisions: document.revisions.filter((revision) => revision.id === document.head)
    };
    return cloudDocument;
  });

  return cloudDocuments;
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
        }
      },
      coauthors: {
        select: {
          user: {
            select: {
              id: true,
              handle: true,
              name: true,
              image: true,
              email: true,
            }
          }
        },
        orderBy: {
          created_at: 'asc'
        }
      },
    },
  });

  if (!document) return null;
  const head = document.head;
  if (!head) return null;
  const revision = await prisma.revision.findUnique({ where: { id: head }, select: { data: true } });
  if (!revision) return null;

  const editorDocument: CloudDocument & EditorDocument = {
    ...document,
    coauthors: document.coauthors.map((coauthor) => coauthor.user),
    data: revision.data as unknown as EditorDocument['data'],
  };

  return editorDocument;
}
const findEditorDocumentById = async (id: string) => {
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
    },
  });

  if (!document) return null;
  const head = document.head;
  if (!head) return null;
  const revision = await prisma.revision.findUnique({ where: { id: head }, select: { data: true } });
  if (!revision) return null;

  const editorDocument: EditorDocument = {
    ...document,
    data: revision.data as unknown as EditorDocument['data'],
  };

  return editorDocument;
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

const findDocumentCoauthorsEmails = async (id: string) => {
  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      coauthors: {
        select: {
          userEmail: true,
        }
      }
    }
  });
  return document?.coauthors.map((coauthor) => coauthor.userEmail) ?? [];
}

const findUserDocument = async (id: string) => {
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
        }
      },
      coauthors: {
        select: {
          user: {
            select: {
              id: true,
              handle: true,
              name: true,
              image: true,
              email: true,
            }
          }
        },
        orderBy: {
          created_at: 'asc'
        }
      },
    }
  });

  if (!document) return null;
  const cloudDocument: CloudDocument = {
    ...document,
    coauthors: document.coauthors.map((coauthor) => coauthor.user),
  };
  return cloudDocument;
}

const createDocument = async (data: Prisma.DocumentCreateInput) => {
  return prisma.document.create({ data });
}

const updateDocument = async (id: string, data: Prisma.DocumentUncheckedUpdateInput) => {
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
  findDocumentCoauthorsEmails,
  findUserDocument,
  findEditorDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  findDocumentIdByHandle,
  checkHandleAvailability
};