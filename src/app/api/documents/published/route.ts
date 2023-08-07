import { findPublishedDocuments } from "@/repositories/document";
import { GetPublishedDocumentsResponse } from "@/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export async function GET() {
  const response: GetPublishedDocumentsResponse = {};
  try {
    const documents = await findPublishedDocuments();
    response.data = documents as unknown as GetPublishedDocumentsResponse["data"];
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "Something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}
