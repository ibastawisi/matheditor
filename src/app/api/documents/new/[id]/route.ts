import { authOptions } from "@/lib/auth";
import { findUserDocument } from "@/repositories/document";
import { ForkDocumentResponse } from "@/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server"
import { getCachedRevision } from "@/repositories/revision";

export const dynamic = "force-dynamic";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const response: ForkDocumentResponse = {};
  try {
    const { searchParams } = new URL(request.url);
    const revisionId = searchParams.get("v");
    const cloudDocument = await findUserDocument(params.id, revisionId);
    if (!cloudDocument) {
      response.error = { title: "Document not found" }
      return NextResponse.json(response, { status: 404 })
    }
    const session = await getServerSession(authOptions);
    const isAuthor = session?.user && session.user.id === cloudDocument.author.id;
    const isCoauthor = session?.user && cloudDocument.coauthors.some(coauthor => coauthor.id === session.user.id);
    if (!isAuthor && !isCoauthor && !cloudDocument.published && !cloudDocument.collab) {
      response.error = { title: "This document is private", subtitle: "You are not authorized to fork this document" }
      return NextResponse.json(response, { status: 403 })
    }
    if (!cloudDocument.head) {
      response.error = { title: "Document not found" }
      return NextResponse.json(response, { status: 404 })
    }
    const revision = await getCachedRevision(revisionId ?? cloudDocument.head);
    if (!revision) {
      response.error = { title: "Revision not found" }
      return NextResponse.json(response, { status: 404 })
    }
    response.data = { id: cloudDocument.id, cloud: cloudDocument, data: revision.data };
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = { title: "Something went wrong", subtitle: "Please try again later" }
    return NextResponse.json(response, { status: 500 })
  }
}
