import { Prisma, prisma } from "@/lib/prisma";
import { validate } from "uuid";
import { deleteCollabState } from "./collab";
import { deleteRevisionData } from "./revision";

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
  const [documents, revisions] = await Promise.all([
    prisma.document.findMany({
      where: { authorId: id },
      select: { id: true },
    }),
    prisma.revision.findMany({
      where: { OR: [{ authorId: id }, { document: { authorId: id } }] },
      select: { id: true },
    }),
  ]);
  const user = await prisma.user.delete({
    where: { id }
  });
  await Promise.all([
    deleteRevisionData(revisions.map((revision) => revision.id)),
    deleteCollabState(documents.map((document) => document.id)),
  ]);
  return user;
}


export { findUser, findUserByEmail, createUser, updateUser, deleteUser };