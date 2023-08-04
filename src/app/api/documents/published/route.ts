import { findPublishedDocuments } from '@/repositories/document';
import { CloudDocument } from '@/types';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export interface GetPublishedDocumentsResponse {
  data?: CloudDocument[];
  error?: string;
}

export async function GET() {
  const response: GetPublishedDocumentsResponse = {};
  try {
    const documents = await findPublishedDocuments();
    response.data = documents as unknown as CloudDocument[];
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}
