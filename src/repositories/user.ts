import { Prisma, prisma } from "@/lib/prisma";

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


export { findAllUsers, findUserById, findUserByEmail, createUser, updateUser, deleteUser };