import { Prisma, prisma } from "@/lib/prisma";
import { CloudDocument } from "@/types";

const findAllUsers = async () => {
  return prisma.user.findMany({
    orderBy: {
      updatedAt: 'desc'
    }
  });
}

const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
  });
}

const findUserByEmail = async (email: string) => {
  return prisma.user.findFirst({
    where: { email },
  });
}

const createUser = async (data: Prisma.UserCreateInput) => {
  return prisma.user.create({ data });
}

const updateUser = async (id: string, data: Prisma.UserUpdateInput) => {
  return prisma.user.update({
    where: { id },
    data
  });
}

const deleteUser = async (id: string) => {
  return prisma.user.delete({
    where: { id }
  });
}

const findUserIdByHandle = async (handle: string) => {
  const user = await prisma.user.findUnique({
    where: { handle: handle.toLowerCase() },
    select: {
      id: true,
    }
  });
  return user?.id;
}

const checkHandleAvailability = async (handle: string) => {
  const userId = await findUserIdByHandle(handle.toLowerCase());
  return !userId;
}

const findUserCoauthoredDocuments = async (id: string) => {
  const documents = await prisma.user.findUnique({
    where: { id },
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
          },
        },
        orderBy: {
          created_at: 'asc'
        }
      }
    }
  });
  if (!documents) return [];
  const cloudDocuments = documents.coauthored.map(({ document }) => {
    const cloudDocument: CloudDocument = {
      ...document,
      variant: "cloud",
      coauthors: document.coauthors.map((coauthor) => coauthor.user),
    };
    return cloudDocument;
  });
  return cloudDocuments;
}


export { findAllUsers, findUserById, findUserByEmail, createUser, updateUser, deleteUser, findUserIdByHandle, checkHandleAvailability, findUserCoauthoredDocuments };