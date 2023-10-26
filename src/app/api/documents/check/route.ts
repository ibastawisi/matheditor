import { findUserDocument } from "@/repositories/document";
import { CheckHandleResponse } from "@/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const response: CheckHandleResponse = {};
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get('handle');
  if (!handle) {
    response.error = "Bad input";
    return NextResponse.json(response, { status: 400 })
  }
  try {
    const userDocument = await findUserDocument(handle);
    response.data = !userDocument;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "Something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}
