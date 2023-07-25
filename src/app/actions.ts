'use server'
import { authOptions } from "@/lib/auth";
import { EditorDocument } from "@/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createDocument, deleteDocument, findDocumentAuthorId, findDocumentById, updateDocument } from "./repositories/document";
import { Prisma } from "@/lib/prisma";

export async function createDocumentAction(body: EditorDocument) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  const { user } = session;

  if (user.disabled) {
    return NextResponse.json({ error: 'account disabled, please contact admin' }, { status: 403 });
  }
  const document = await createDocument({ ...body, author: { connect: { id: user.id } } } as unknown as Prisma.DocumentCreateInput);
  return document;
}

export async function updateDocumentAction(id: string, body: Partial<EditorDocument>) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  const { user } = session;
  const authorId = await findDocumentAuthorId(id);
  if (user.disabled) {
    return NextResponse.json({ error: 'account disabled, please contact admin' }, { status: 403 });
  }
  if (user.id !== authorId) {
    return NextResponse.json({ error: 'you are not allowed to update this document' }, { status: 403 });
  }
  const document = await updateDocument(id, body as unknown as Prisma.DocumentUpdateInput);
  return document;
}

export async function deleteDocumentAction(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  const { user } = session;
  const authorId = await findDocumentAuthorId(id);
  if (user.disabled) {
    return NextResponse.json({ error: 'account disabled, please contact admin' }, { status: 403 });
  }
  if (user.id !== authorId) {
    return NextResponse.json({ error: 'you are not allowed to delete this document' }, { status: 403 });
  }
  if (user.id === authorId) {
    await deleteDocument(id);
  }
  return id;
}

export async function getDocumentAction(id: string) {
  const document = await findDocumentById(id);
  if (!document) return NextResponse.json({ error: 'document not found' }, { status: 404 });
  return document;
}