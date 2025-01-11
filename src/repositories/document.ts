import { Prisma, prisma } from "@/lib/prisma";
import { CloudDocument, EditorDocument } from "@/types";
import { validate } from "uuid";
import { findRevisionById, findRevisionThumbnail } from "./revision";

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

  const documentIds = documents.map(document => `'${document.id}'`);
  const revisionSizesQuery = `SELECT id, pg_column_size("Revision".*) as size from "Revision" WHERE "documentId" IN (${documentIds})`;
  const revisionSizes: { id: string, size: number }[] = documentIds.length > 0 ? await prisma.$queryRawUnsafe(revisionSizesQuery) : [];

  const cloudDocuments = await Promise.all(documents.map(async (document) => {
    const revisions = document.revisions.map(revision => {
      const size = revisionSizes.find((revisionSize) => revisionSize.id === revision.id)?.size ?? 0;
      return { ...revision, size };
    });
    const size = new Blob([JSON.stringify(document)]).size + revisions.reduce((acc, revision) => acc + revision.size, 0);
    const thumbnail = await findRevisionThumbnail(document.head);
    const cloudDocument: CloudDocument = {
      ...document,
      coauthors: document.coauthors.map((coauthor) => coauthor.user),
      revisions: document.collab ? revisions : revisions.filter((revision) => revision.id === document.head),
      size,
      thumbnail,
    };
    return cloudDocument;
  }));
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
  const revisionSizes: { id: string, size: number }[] = documentIds.length > 0 ? await prisma.$queryRawUnsafe(revisionSizesQuery) : [];

  const authoredDocuments = await Promise.all(documents.map(async (document) => {
    const revisions = document.revisions.map(revision => {
      const size = revisionSizes.find((revisionSize) => revisionSize.id === revision.id)?.size ?? 0;
      return { ...revision, size };
    });
    const size = new Blob([JSON.stringify(document)]).size + revisions.reduce((acc, revision) => acc + revision.size, 0);
    const thumbnail = await findRevisionThumbnail(document.head);
    const cloudDocument: CloudDocument = {
      ...document,
      coauthors: document.coauthors.map((coauthor) => coauthor.user),
      revisions,
      size,
      thumbnail,
    };
    return cloudDocument;
  }));
  const coauthoredDocuments = await findDocumentsByCoauthorId(authorId);
  const collaboratorDocuments = await findDocumentsByCollaboratorId(authorId);
  const publishedDocuments = await findPublishedDocuments();
  return [...authoredDocuments, ...coauthoredDocuments, ...collaboratorDocuments, ...publishedDocuments]
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

  const documentIds = documents.map(document => `'${document.id}'`);
  const revisionSizesQuery = `SELECT id, pg_column_size("Revision".*) as size from "Revision" WHERE "documentId" IN (${documentIds})`;
  const revisionSizes: { id: string, size: number }[] = documentIds.length > 0 ? await prisma.$queryRawUnsafe(revisionSizesQuery) : [];

  const cloudDocuments = await Promise.all(documents.map(async (document) => {
    const revisions = document.revisions.map(revision => {
      const size = revisionSizes.find((revisionSize) => revisionSize.id === revision.id)?.size ?? 0;
      return { ...revision, size };
    });

    const thumbnail = await findRevisionThumbnail(document.head);
    const cloudDocument: CloudDocument = {
      ...document,
      coauthors: document.coauthors.map((coauthor) => coauthor.user),
      revisions: document.collab ? revisions : revisions.filter((revision) => revision.id === document.head),
      size: new Blob([JSON.stringify(document)]).size + revisions.reduce((acc, revision) => acc + revision.size, 0),
      thumbnail,
    };
    return cloudDocument;
  }));

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

  const documentIds = user.coauthored.map(({ document }) => `'${document.id}'`);
  const revisionSizesQuery = `SELECT id, pg_column_size("Revision".*) as size from "Revision" WHERE "documentId" IN (${documentIds})`;
  const revisionSizes: { id: string, size: number }[] = documentIds.length > 0 ? await prisma.$queryRawUnsafe(revisionSizesQuery) : [];

  const cloudDocuments = await Promise.all(user.coauthored.map(async ({ document }) => {
    const revisions = document.revisions.map(revision => {
      const size = revisionSizes.find((revisionSize) => revisionSize.id === revision.id)?.size ?? 0;
      return { ...revision, size };
    });
    const size = new Blob([JSON.stringify(document)]).size + revisions.reduce((acc, revision) => acc + revision.size, 0);
    const thumbnail = await findRevisionThumbnail(document.head);
    const cloudDocument: CloudDocument = {
      ...document,
      coauthors: document.coauthors.map((coauthor) => coauthor.user),
      revisions,
      size,
      thumbnail,
    };
    return cloudDocument;
  }));
  return cloudDocuments;
}

const findDocumentsByCollaboratorId = async (authorId: string) => {
  const revisions = await prisma.revision.findMany({
    where: { authorId, document: { collab: true, authorId: { not: authorId } } },
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
  });

  const documentIds = revisions.map(({ document }) => `'${document.id}'`);
  const revisionSizesQuery = `SELECT id, pg_column_size("Revision".*) as size from "Revision" WHERE "documentId" IN (${documentIds})`;
  const revisionSizes: { id: string, size: number }[] = documentIds.length > 0 ? await prisma.$queryRawUnsafe(revisionSizesQuery) : [];

  const cloudDocuments = await Promise.all(revisions.map(async ({ document }) => {
    const revisions = document.revisions.map(revision => {
      const size = revisionSizes.find((revisionSize) => revisionSize.id === revision.id)?.size ?? 0;
      return { ...revision, size };
    });
    const size = new Blob([JSON.stringify(document)]).size + revisions.reduce((acc, revision) => acc + revision.size, 0);
    const thumbnail = await findRevisionThumbnail(document.head);
    const cloudDocument: CloudDocument = {
      ...document,
      coauthors: document.coauthors.map((coauthor) => coauthor.user),
      revisions,
      size,
      thumbnail,
    };
    return cloudDocument;
  }));

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

  const revisionSizesQuery = `SELECT id, pg_column_size("Revision".*) as size from "Revision" WHERE "documentId" = '${document.id}'`;
  const revisionSizes: { id: string, size: number }[] = await prisma.$queryRawUnsafe(revisionSizesQuery);
  const size = new Blob([JSON.stringify(document)]).size + revisionSizes.reduce((acc, revision) => acc + revision.size, 0);
  const thumbnail = await findRevisionThumbnail(document.head);
  const cloudDocument: CloudDocument = {
    ...document,
    coauthors: document.coauthors.map((coauthor) => coauthor.user),
    revisions: document.revisions.map(revision => {
      const size = revisionSizes.find((revisionSize) => revisionSize.id === revision.id)?.size ?? 0;
      return { ...revision, size };
    }),
    size,
    thumbnail,
  };
  if (revisions !== "all") {
    const revisionId = revisions ?? document.head;
    const revision = cloudDocument.revisions.find((revision) => revision.id === revisionId);
    if (!revision) return null;
    cloudDocument.revisions = [revision];
    cloudDocument.updatedAt = revision.createdAt;
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