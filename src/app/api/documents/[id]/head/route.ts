import { findUserDocument } from "@/repositories/document";
import { GetDocumentHeadResponse } from "@/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const response: GetDocumentHeadResponse = {};
  const url = new URL(request.url);
  const handle = url.pathname.split("/")[3];
  if (!handle) {
    response.error = "Bad input";
    return NextResponse.json(response, { status: 400 })
  }
  try {
    const userDocument = await findUserDocument(handle);
    if (!userDocument) {
      response.error = "Document not found";
      return NextResponse.json(response, { status: 404 })
    }
    response.data = userDocument.head;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "Something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}
