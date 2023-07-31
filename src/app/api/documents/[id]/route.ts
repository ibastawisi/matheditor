import { authOptions } from '@/lib/auth';
import { Prisma } from '@/lib/prisma';
import { deleteDocument, findDocumentAuthorId, findDocumentById, updateDocument } from '@/repositories/document';
import { EditorDocument, UserDocument } from '@/types';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server'
import { validate } from 'uuid';

export const dynamic = 'force-dynamic';

export interface GetDocumentResponse {
  data?: EditorDocument;
  error?: string;
}

export interface PatchDocumentResponse {
  data?: UserDocument;
  error?: string;
}

export interface DeleteDocumentResponse {
  data?: string;
  error?: string;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const response: GetDocumentResponse = {};
  try {
    if (!validate(params.id)) {
      response.error = 'invalid id';
      return NextResponse.json(response, { status: 400 })
    }
    const document = await findDocumentById(params.id);
    if (!document) {
      response.error = 'document not found';
      return NextResponse.json(response, { status: 404 })
    }
    response.data = document as unknown as EditorDocument;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const response: PatchDocumentResponse = {};
  try {
    if (!validate(params.id)) {
      response.error = 'invalid id';
      return NextResponse.json(response, { status: 400 })
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = 'not authenticated';
      return NextResponse.json(response, { status: 401 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = 'account disabled, please contact admin';
      return NextResponse.json(response, { status: 403 })
    }
    const authorId = await findDocumentAuthorId(params.id);
    if (user.id !== authorId) {
      response.error = 'you are not allowed to update this document';
      return NextResponse.json(response, { status: 403 })
    }
    const body = await request.json();
    if (!body) {
      response.error = 'bad input';
      return NextResponse.json(response, { status: 400 })
    }
    const document = await updateDocument(params.id, body as unknown as Prisma.DocumentUpdateInput);
    const { data, ...userDocument } = document;
    response.data = userDocument as unknown as UserDocument;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const response: DeleteDocumentResponse = {};
  try {
    if (!validate(params.id)) {
      response.error = 'invalid id';
      return NextResponse.json(response, { status: 400 })
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = 'not authenticated';
      return NextResponse.json(response, { status: 401 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = 'account disabled, please contact admin';
      return NextResponse.json(response, { status: 403 })
    }
    const authorId = await findDocumentAuthorId(params.id);
    if (user.id !== authorId) {
      response.error = 'you are not allowed to delete this document';
      return NextResponse.json(response, { status: 403 })
    }
    await deleteDocument(params.id);
    response.data = params.id;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}