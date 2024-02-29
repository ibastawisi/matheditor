import { Prisma, prisma } from "@/lib/prisma";
import { CloudDocument, EditorDocument } from "@/types";
import { validate } from "uuid";
import { findRevisionById } from "./revision";

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
      collab: true,
      private: true,
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
          createdAt: 'asc'
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
      revisions: document.collab ? document.revisions : document.revisions.filter((revision) => revision.id === document.head)
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
      collab: true,
      private: true,
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
          createdAt: 'asc'
        }
      },
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  const documentIds = documents.map(document => `'${document.id}'`);
  const revisionSizesQuery = `SELECT id, pg_column_size("Revision".*) as size from "Revision" WHERE "documentId" IN (${documentIds})`;
  const revisionSizes: { id: string, size: number }[] = await prisma.$queryRawUnsafe(revisionSizesQuery);

  const authoredDocuments = documents.map((document) => {
    const revisions = document.revisions.map(revision => {
      const size = revisionSizes.find((revisionSize) => revisionSize.id === revision.id)?.size ?? 0;
      return { ...revision, size };
    });
    const cloudDocument: CloudDocument = {
      ...document,
      coauthors: document.coauthors.map((coauthor) => coauthor.user),
      revisions,
      size: new Blob([JSON.stringify(document)]).size + revisions.reduce((acc, revision) => acc + revision.size, 0),
    };
    return cloudDocument;
  });
  const coauthoredDocuments = await findDocumentsByCoauthorId(authorId);
  const publishedDocuments = await findPublishedDocuments();
  return [...authoredDocuments, ...coauthoredDocuments, ...publishedDocuments]
    .filter((document, index, self) => self.findIndex((d) => d.id === document.id) === index)
    .sort((a, b) => {
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
      collab: true,
      private: true,
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
          createdAt: 'asc'
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
      revisions: document.collab ? document.revisions : document.revisions.filter((revision) => revision.id === document.head)
    };
    return cloudDocument;
  });

  return cloudDocuments;
}

const findDocumentsByCoauthorId = async (authorId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: authorId },
    select: {
      coauthored: {
        select: {
          document: {
            select: {
              id: true,
              handle: true,
              name: true,
              createdAt: true,
              updatedAt: true,
              published: true,
              collab: true,
              private: true,
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
                  createdAt: 'asc'
                }
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });
  if (!user) return [];
  const cloudDocuments = user.coauthored.map(({ document }) => {
    const cloudDocument: CloudDocument = {
      ...document,
      coauthors: document.coauthors.map((coauthor) => coauthor.user),
    };
    return cloudDocument;
  });
  return cloudDocuments;
}

const findEditorDocument = async (handle: string) => {
  const document = await prisma.document.findUnique({
    where: validate(handle) ? { id: handle } : { handle: handle.toLowerCase() },
    select: {
      id: true,
      handle: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      published: true,
      collab: true,
      private: true,
      baseId: true,
      head: true,
    },
  });

  if (!document) return null;
  const revision = await findRevisionById(document.head);
  if (!revision) return null;

  const editorDocument: EditorDocument = {
    ...document,
    data: revision.data as unknown as EditorDocument['data'],
  };

  return editorDocument;
}


const findUserDocument = async (handle: string, revisions?: "all" | string | null) => {
  const document = await prisma.document.findUnique({
    where: validate(handle) ? { id: handle } : { handle: handle.toLowerCase() },
    select: {
      id: true,
      handle: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      published: true,
      collab: true,
      private: true,
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
          createdAt: 'asc'
        }
      },
    }
  });

  if (!document) return null;

  const revisionSizes: { id: string, size: number }[] = await prisma.$queryRawUnsafe(`SELECT id, pg_column_size("Revision".*) as size from "Revision" WHERE "documentId" = '${document.id}'`);
  const cloudDocument: CloudDocument = {
    ...document,
    coauthors: document.coauthors.map((coauthor) => coauthor.user),
    revisions: document.revisions.map(revision => {
      const size = revisionSizes.find((revisionSize) => revisionSize.id === revision.id)?.size ?? 0;
      return { ...revision, size };
    }),
    size: new Blob([JSON.stringify(document)]).size + revisionSizes.reduce((acc, revision) => acc + revision.size, 0),
  };
  if (revisions !== "all") {
    const revisionId = revisions ?? document.head;
    cloudDocument.revisions = cloudDocument.revisions.filter((revision) => revision.id === revisionId);
    cloudDocument.updatedAt = cloudDocument.revisions[0].createdAt;
  }
  return cloudDocument;
}

const createDocument = async (data: Prisma.DocumentUncheckedCreateInput) => {
  if (!data.id) return null;
  await prisma.document.create({ data });
  return findUserDocument(data.id);
}

const updateDocument = async (handle: string, data: Prisma.DocumentUncheckedUpdateInput) => {
  await prisma.document.update({
    where: validate(handle) ? { id: handle } : { handle: handle.toLowerCase() },
    data
  });
  return findUserDocument(handle, "all");
}

const deleteDocument = async (handle: string) => {
  return prisma.document.delete({
    where: validate(handle) ? { id: handle } : { handle: handle.toLowerCase() },
  });
}

export {
  findPublishedDocuments,
  findDocumentsByAuthorId,
  findDocumentsByCoauthorId,
  findPublishedDocumentsByAuthorId,
  findUserDocument,
  findEditorDocument,
  createDocument,
  updateDocument,
  deleteDocument,
};