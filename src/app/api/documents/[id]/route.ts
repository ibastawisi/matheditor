import { authOptions } from "@/lib/auth";
import { deleteDocument, findDocumentAuthorId, findDocumentById, findDocumentIdByHandle, findUserDocument, updateDocument } from "@/repositories/document";
import { DeleteDocumentResponse, GetDocumentResponse, PatchDocumentResponse } from "@/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server"
import { createRevision } from "@/repositories/revision";
import { validate } from "uuid";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const response: GetDocumentResponse = {};
  try {
    const isValidId = validate(params.id);
    if (!isValidId) {
      try {
        const id = await findDocumentIdByHandle(params.id);
        if (id) params.id = id;
      } catch (error) {
        response.error = "Document not found";
        return NextResponse.json(response, { status: 404 })
      }
    }
    const document = await findDocumentById(params.id);
    if (!document) {
      response.error = "Document not found";
      return NextResponse.json(response, { status: 404 })
    }
    response.data = document as unknown as GetDocumentResponse["data"];
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "Something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const response: PatchDocumentResponse = {};
  try {
    if (!validate(params.id)) {
      response.error = "Invalid id";
      return NextResponse.json(response, { status: 400 })
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = "Not authenticated, please login"
      return NextResponse.json(response, { status: 401 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = "Account is disabled for violating terms of service";
      return NextResponse.json(response, { status: 403 })
    }
    const authorId = await findDocumentAuthorId(params.id);
    if (authorId && user.id !== authorId) {
      response.error = "You don't have permission to edit this document";
      return NextResponse.json(response, { status: 403 })
    }
    const body = await request.json();
    if (!body) {
      response.error = "Bad input"
      return NextResponse.json(response, { status: 400 })
    }
    if (body.handle) {
      const error = await validateHandle(params.id, body.handle);
      if (error) {
        response.error = error;
        return NextResponse.json(response, { status: 400 })
      }
    }
    if (body.data) {
      const revision = await createRevision({
        documentId: params.id,
        authorId: user.id,
        createdAt: new Date().toISOString(),
        data: body.data,
      })
      body.head = revision.id;
      delete body.data;
    }

    await updateDocument(params.id, body);
    const userDocument = await findUserDocument(params.id);
    response.data = userDocument as unknown as PatchDocumentResponse["data"];
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "Something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const response: DeleteDocumentResponse = {};
  try {
    if (!validate(params.id)) {
      response.error = "Invalid id";
      return NextResponse.json(response, { status: 400 })
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = "Not authenticated, please login"
      return NextResponse.json(response, { status: 401 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = "Account is disabled for violating terms of service";
      return NextResponse.json(response, { status: 403 })
    }
    const authorId = await findDocumentAuthorId(params.id);
    if (user.id !== authorId) {
      response.error = "You don't have permission to edit this document";
      return NextResponse.json(response, { status: 403 })
    }
    await deleteDocument(params.id);
    response.data = params.id;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "Something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}

const validateHandle = async (id: string, handle: string) => {
  if (handle.length < 3) {
    return "Handle must be at least 3 characters long";
  }
  if (!/^[a-zA-Z0-9-]+$/.test(handle)) {
    return "Handle must only contain letters, numbers, and dashes";
  }
  const handleId = await findDocumentIdByHandle(handle);
  if (handleId && handleId !== id) {
    return "Handle is already taken";
  }
  return null;
}