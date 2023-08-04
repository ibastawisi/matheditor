import { authOptions } from '@/lib/auth';
import { createDocument, findDocumentsByAuthorId, findUserDocument } from '@/repositories/document';
import { CloudDocument } from '@/types';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface GetDocumentsResponse {
  data?: CloudDocument[];
  error?: string;
}

export interface PostDocumentsResponse {
  data?: CloudDocument;
  error?: string;
}

export async function GET() {
  const response: GetDocumentsResponse = {};
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      response.data = [];
      return NextResponse.json(response, { status: 200 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = 'account disabled, please contact admin';
      return NextResponse.json(response, { status: 403 })
    }
    const documents = await findDocumentsByAuthorId(user.id);
    response.data = documents as unknown as CloudDocument[];
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "something went wrong";
    return NextResponse.json(response, { status: 500 })
  }

}

export async function POST(request: Request) {
  const response: PostDocumentsResponse = {};
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = 'not authenticated';
      return NextResponse.json(response, { status: 401 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = 'account disabled, please contact admin';
      return NextResponse.json(response, { status: 403 })
    }

    const body = await request.json();
    if (!body) {
      response.error = 'bad input';
      return NextResponse.json(response, { status: 400 })
    }

    await createDocument({ ...body, authorId: user.id });
    const userDocument = await findUserDocument(body.id);
    response.data = userDocument as unknown as CloudDocument;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}
