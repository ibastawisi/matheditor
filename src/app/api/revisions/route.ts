import { authOptions } from "@/lib/auth";
import { createRevision } from "@/repositories/revision";
import { EditorDocumentRevision, PostRevisionResponse } from "@/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Prisma } from "@/lib/prisma"
import { findUserDocument } from "@/repositories/document";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const response: PostRevisionResponse = {};
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = { title: "Unauthorized", subtitle: "Please sign in to save your revision to the cloud"}
      return NextResponse.json(response, { status: 401 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = { title: "Account Disabled", subtitle: "Account is disabled for violating terms of service"}
      return NextResponse.json(response, { status: 403 })
    }
    const body = await request.json() as EditorDocumentRevision;
    if (!body) {
      response.error = { title: "Bad Request", subtitle: "No revision provided" }
      return NextResponse.json(response, { status: 400 })
    }

    const cloudDocument = await findUserDocument(body.documentId);
    if (!cloudDocument) {
      response.error = { title: "Not Found", subtitle: "Document not found" }
      return NextResponse.json(response, { status: 404 })
    }
    const isAuthor = user.id === cloudDocument.author.id;
    const isCoauthor = cloudDocument.coauthors.some(coauthor => coauthor.id === user.id);
    const isCollab = cloudDocument.collab;

    if (!isAuthor && !isCoauthor && !isCollab) {
      response.error = { title: "This document is private", subtitle: "You are not authorized to Edit this document" }
      return NextResponse.json(response, { status: 403 })
    }

    const input: Prisma.RevisionUncheckedCreateInput = {
      id: body.id,
      authorId: user.id,
      documentId: body.documentId,
      createdAt: body.createdAt,
      data: body.data as unknown as Prisma.JsonObject,
    };

    const revision = await createRevision(input);
    response.data = {
      id: revision.id,
      documentId: revision.documentId,
      createdAt: revision.createdAt,
      author: {
        id: user.id,
        handle: user.handle,
        name: user.name,
        image: user.image,
        email: user.email,
      },
    }
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = { title: "Something went wrong", subtitle: "Please try again later" }
    return NextResponse.json(response, { status: 500 })
  }
}
