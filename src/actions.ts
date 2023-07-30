'use server'
import { authOptions } from "@/lib/auth";
import { Admin, AdminDocument, AdminUser, EditorDocument, UserDocument } from "@/types";
import { getServerSession } from "next-auth";
import { createDocument, deleteDocument, findAllDocuments, findDocumentAuthorId, findDocumentById, findDocumentsByAuthorId, updateDocument } from "./repositories/document";
import { Prisma } from "@/lib/prisma";
import { validate } from "uuid";
import { findAllUsers } from "./repositories/user";

export async function findAdminDocumentsAction() {
  const response: { data?: AdminDocument[], error?: string } = {};
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = 'not authenticated';
      return response;
    }
    const { user } = session;
    if (user.disabled) {
      response.error = 'account disabled, please contact admin';
      return response;
    }
    if (user.role !== 'admin') {
      response.error = 'not authorized';
      return response;
    }
    const documents = await findAllDocuments();
    response.data = JSON.parse(JSON.stringify(documents));
    return response;
  } catch {
    response.error = "something went wrong";
    return response;
  }
}

export async function findAdminUsersAction() {
  const response: { data?: AdminUser[], error?: string } = {};
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = 'not authenticated';
      return response;
    }
    const { user } = session;
    if (user.disabled) {
      response.error = 'account disabled, please contact admin';
      return response;
    }
    if (user.role !== 'admin') {
      response.error = 'not authorized';
      return response;
    }
    const users = await findAllUsers();
    response.data = JSON.parse(JSON.stringify(users));
    return response;
  } catch {
    response.error = "something went wrong";
    return response;
  }
}

export async function getAdminAction() {
  const response: { data?: Admin, error?: string } = {};
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = 'not authenticated';
      return response;
    }
    const { user } = session;
    if (user.disabled) {
      response.error = 'account disabled, please contact admin';
      return response;
    }
    if (user.role !== 'admin') {
      response.error = 'not authorized';
      return response;
    }
    const users = await findAllUsers();
    const documents = await findAllDocuments();
    response.data = {
      users: JSON.parse(JSON.stringify(users)),
      documents: JSON.parse(JSON.stringify(documents)),
    };
    return response;    
  } catch {
    response.error = "something went wrong";
    return response;
  }
}

export async function createDocumentAction(body: EditorDocument) {
  const response: { data?: UserDocument, error?: string } = {};
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = 'not authenticated';
      return response;
    }
    const { user } = session;
    if (user.disabled) {
      response.error = 'account disabled, please contact admin';
      return response;
    }
    const document = await createDocument({ ...body, author: { connect: { id: user.id } } } as unknown as Prisma.DocumentCreateInput);
    const { data, ...userDocument } = document;
    response.data = JSON.parse(JSON.stringify(userDocument));
    return response;
  } catch {
    response.error = "something went wrong";
    return response;
  }
}

export async function updateDocumentAction(id: string, body: Partial<EditorDocument>) {
  const response: { data?: UserDocument, error?: string } = {};
  try {
    if (!validate(id)) {
      response.error = 'invalid id';
      return response;
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = 'not authenticated';
      return response;
    }
    const { user } = session;
    if (user.disabled) {
      response.error = 'account disabled, please contact admin';
      return response;
    }
    const authorId = await findDocumentAuthorId(id);
    if (user.id !== authorId) {
      response.error = 'you are not allowed to update this document';
      return response;
    }
    const document = await updateDocument(id, body as unknown as Prisma.DocumentUpdateInput);
    const { data, ...userDocument } = document;
    response.data = JSON.parse(JSON.stringify(userDocument));
    return response;
  } catch {
    response.error = "something went wrong";
    return response;
  }
}

export async function deleteDocumentAction(id: string) {
  const response: { data?: string, error?: string } = {};
  try {
    if (!validate(id)) {
      response.error = 'invalid id';
      return response;
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = 'not authenticated';
      return response;
    }
    const { user } = session;
    if (user.disabled) {
      response.error = 'account disabled, please contact admin';
      return response;
    }
    const authorId = await findDocumentAuthorId(id);
    if (user.id !== authorId) {
      response.error = 'you are not allowed to delete this document';
      return response;
    }
    if (user.id === authorId) {
      await deleteDocument(id);
    }
    response.data = id;
    return response;
  } catch {
    response.error = "something went wrong";
    return response;
  }
}

export async function getDocumentAction(id: string) {
  const response: { data?: EditorDocument, error?: string } = {};
  try {
    if (!validate(id)) {
      response.error = 'invalid id';
      return response;
    }
    const document = await findDocumentById(id);
    if (!document) {
      response.error = 'document not found';
      return response;
    }
    response.data = JSON.parse(JSON.stringify(document));
    return response;
  } catch {
    response.error = "something went wrong";
    return response;
  }
}

export async function getDocumentsAction() {
  const response: { data?: UserDocument[], error?: string } = {};
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = 'not authenticated';
      return response;
    }
    const { user } = session;
    if (user.disabled) {
      response.error = 'account disabled, please contact admin';
      return response;
    }
    const documents = await findDocumentsByAuthorId(user.id);
    response.data = JSON.parse(JSON.stringify(documents));
    return response;
  } catch {
    response.error = "something went wrong";
    return response;
  }
}