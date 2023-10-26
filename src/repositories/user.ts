import { Prisma, prisma } from "@/lib/prisma";
import { CloudDocument } from "@/types";
import { validate } from "uuid";

const findUser = async (handle: string) => {
  return prisma.user.findUnique({
    where: validate(handle) ? { id: handle } : { handle: handle.toLowerCase() },
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


export { findUser, findUserByEmail, createUser, updateUser, deleteUser };