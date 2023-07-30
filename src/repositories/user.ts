import { Prisma, prisma } from "@/lib/prisma";

const findAllUsers = async () => {
  return prisma.user.findMany({
    include: {
      documents: {
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
      },
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });
}

const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      role: true,
      disabled: true,
      documents: {
        where: {
          published: true
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          published: true,
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }
    }
  });
}

const findUserByEmail = async (email: string) => {
  return prisma.user.findFirst({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      disabled: true,
      createdAt: true,
      updatedAt: true,
    }
  });
}

const findUserBySessionId = async (sessionId: string) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          documents: {
            select: {
              id: true,
              name: true,
              createdAt: true,
              updatedAt: true,
              published: true,
            },
            orderBy: {
              updatedAt: 'desc'
            }
          }
        }
      }
    }
  });
  return session?.user;
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

const findUserMetadata = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
    }
  });
}

export { findAllUsers, findUserById, findUserByEmail, findUserBySessionId, createUser, updateUser, deleteUser, findUserMetadata };