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

  const cloudDocuments = await Promise.all(documents.map(async (document) => {
    const revisions = document.collab ? document.revisions : document.revisions.filter((revision) => revision.id === document.head);
    const thumbnail = await findRevisionThumbnail(document.head);
    const cloudDocument: CloudDocument = {
      ...document,
      coauthors: document.coauthors.map((coauthor) => coauthor.user),
      revisions,
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

  const authoredDocuments = await Promise.all(documents.map(async (document) => {
    const thumbnail = await findRevisionThumbnail(document.head);
    const cloudDocument: CloudDocument = {
      ...document,
      coauthors: document.coauthors.map((coauthor) => coauthor.user),
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

const findCloudStorageUsageByAuthorId = async (authorId: string) => {
  const documentSizesQuery = `
    SELECT
      d.id,
      d.name,
      COALESCE(CAST(pg_column_size(d.*) + SUM(pg_column_size(r.*)) AS NUMERIC), 0) AS size
    FROM
      "Document" d
    LEFT JOIN
      "Revision" r
    ON
      d.id = r."documentId"
    WHERE
      d."authorId" = '${authorId}' 
    GROUP BY 
      d.id
    ORDER BY 
      d."updatedAt" DESC;
  `;
  const documentSizes: { id: string, name: string, size: number }[] = await prisma.$queryRawUnsafe(documentSizesQuery);
  return documentSizes;
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

  const cloudDocuments = await Promise.all(documents.map(async (document) => {
    const revisions = document.collab ? document.revisions : document.revisions.filter((revision) => revision.id === document.head);
    const thumbnail = await findRevisionThumbnail(document.head);
    const cloudDocument: CloudDocument = {
      ...document,
      coauthors: document.coauthors.map((coauthor) => coauthor.user),
      revisions,
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

  const cloudDocuments = await Promise.all(user.coauthored.map(async ({ document }) => {
    const thumbnail = await findRevisionThumbnail(document.head);
    const cloudDocument: CloudDocument = {
      ...document,
      coauthors: document.coauthors.map((coauthor) => coauthor.user),
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

  const cloudDocuments = await Promise.all(revisions.map(async ({ document }) => {
    const thumbnail = await findRevisionThumbnail(document.head);
    const cloudDocument: CloudDocument = {
      ...document,
      coauthors: document.coauthors.map((coauthor) => coauthor.user),
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

  const thumbnail = await findRevisionThumbnail(document.head);
  const cloudDocument: CloudDocument = {
    ...document,
    coauthors: document.coauthors.map((coauthor) => coauthor.user),
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
  findCloudStorageUsageByAuthorId,
  findDocumentsByCoauthorId,
  findPublishedDocumentsByAuthorId,
  findUserDocument,
  findEditorDocument,
  createDocument,
  updateDocument,
  deleteDocument,
};