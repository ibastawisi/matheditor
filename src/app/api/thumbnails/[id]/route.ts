import { authOptions } from "@/lib/auth";
import { findUserDocument } from "@/repositories/document";
import { findRevisionThumbnail } from "@/repositories/revision";
import { GetDocumentThumbnailResponse } from "@/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server"

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const response: GetDocumentThumbnailResponse = {};
  try {
    const userDocument = await findUserDocument(params.id);
    if (!userDocument) {
      response.error = { title: "Document not found" }
      return NextResponse.json(response, { status: 404 })
    }
    const isPrivate = userDocument.private;
    if (isPrivate) {
      const session = await getServerSession(authOptions);
      if (!session) {
        response.error = { title: "This document is private", subtitle: "Please sign in to View it" }
        return NextResponse.json(response, { status: 401 })
      }
      if (session) {
        const { user } = session;
        if (user.disabled) {
          response.error = { title: "Account Disabled", subtitle: "Account is disabled for violating terms of service" }
          return NextResponse.json(response, { status: 403 })
        }
        const isAuthor = user.id === userDocument.author.id;
        const isCoauthor = userDocument.coauthors.some(coauthor => coauthor.id === user.id);
        if (!isAuthor && !isCoauthor) {
          response.error = { title: "This document is private", subtitle: "You are not authorized to View this document" }
          return NextResponse.json(response, { status: 403 })
        }
      }
    }
    const thumbnail = await findRevisionThumbnail(userDocument.head);
    response.data = thumbnail;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = { title: "Something went wrong", subtitle: "Please try again later" }
    return NextResponse.json(response, { status: 500 })
  }
}
