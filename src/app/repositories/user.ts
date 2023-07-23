import { Prisma, prisma } from "@/app/prisma";

const findAllUsers = async () => {
  return prisma.user.findMany({
    include: {
      documents: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          isPublic: true,
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
      picture: true,
      createdAt: true,
      updatedAt: true,
      admin: true,
      disabled: true,
      documents: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          isPublic: true,
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }
    }
  });
}

const findPublicUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      picture: true,
      createdAt: true,
      updatedAt: true,
      admin: true,
      disabled: true,
      documents: {
        where: {
          isPublic: true
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          isPublic: true,
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }
    }
  });
}

const findUserByGoogleId = async (googleId: string) => {
  return prisma.user.findFirst({
    where: { googleId },
    select: {
      id: true,
      name: true,
      email: true,
      picture: true,
      createdAt: true,
      updatedAt: true,
      documents: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          isPublic: true,
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }
    }
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

const getUsersCount = async () => {
  return prisma.user.count();
}

const getLatestUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      picture: true,
      createdAt: true,
      updatedAt: true,
      documents: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          isPublic: true,
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 5
  });
}

const findUserMetadata = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      picture: true,
      createdAt: true,
    }
  });
}

export { findAllUsers, findUserById, findUserByGoogleId, createUser, updateUser, deleteUser, getUsersCount, getLatestUsers, findPublicUserById, findUserMetadata };