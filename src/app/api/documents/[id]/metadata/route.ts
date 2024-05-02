import { findUserDocument } from "@/repositories/document";
import { GetCloudDocumentResponse } from "@/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const response: GetCloudDocumentResponse = {};
  const url = new URL(request.url);
  const handle = url.pathname.split("/")[3];
  if (!handle) {
    response.error = { title: "Bad Request", subtitle: "No document handle provided" }
    return NextResponse.json(response, { status: 400 })
  }
  try {
    const userDocument = await findUserDocument(handle, "all");
    if (!userDocument) {
      response.error = { title: "Document not found" }
      return NextResponse.json(response, { status: 200 })
    }
    const isPrivate = userDocument.private;
    if (isPrivate) {
      response.error = { title: "This document is private" }
      return NextResponse.json(response, { status: 200 })
    }
    const isCollab = userDocument.collab;
    if (!isCollab) userDocument.revisions = [userDocument.revisions[0]];
    response.data = userDocument;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = { title: "something went wrong", subtitle: "Please try again later" }
    return NextResponse.json(response, { status: 500 })
  }
}
