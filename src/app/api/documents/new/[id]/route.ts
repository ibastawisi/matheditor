import { authOptions } from "@/lib/auth";
import { findDocumentIdByHandle, findUserDocument } from "@/repositories/document";
import { ForkDocumentResponse } from "@/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server"
import { findRevisionById } from "@/repositories/revision";
import { validate } from "uuid";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const response: ForkDocumentResponse = {};
  try {
    const isValidId = validate(params.id);
    if (!isValidId) {
      try {
        const id = await findDocumentIdByHandle(params.id);
        if (id) params.id = id;
        else {
          response.error = "Document not found";
          return NextResponse.json(response, { status: 404 })
        }
      } catch (error) {
        response.error = "Document not found";
        return NextResponse.json(response, { status: 404 })
      }
    }
    const session = await getServerSession(authOptions);
    const cloudDocument = await findUserDocument(params.id);
    if (!cloudDocument) {
      response.error = "Document not found";
      return NextResponse.json(response, { status: 404 })
    }
    const isAuthor = session?.user && session.user.id === cloudDocument.author.id;
    const isCoauthor = session?.user && cloudDocument.coauthors.some(coauthor => coauthor.id === session.user.id);
    if (!isAuthor && !isCoauthor && !cloudDocument.published) {
      response.error = "You don't have permission to fork this document";
      return NextResponse.json(response, { status: 403 })
    }
    if (!cloudDocument.head) {
      response.error = "Document not found";
      return NextResponse.json(response, { status: 404 })
    }
    const revision = await findRevisionById(cloudDocument.head);
    if (!revision) {
      response.error = "Document not found";
      return NextResponse.json(response, { status: 404 })
    }
    response.data = { id: cloudDocument.id, cloud: cloudDocument, data: revision.data };
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "Something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}
