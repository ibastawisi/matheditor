import { authOptions } from '@/lib/auth';
import { findAllDocuments } from '@/repositories/document';
import { findAllUsers } from '@/repositories/user';
import { Admin } from '@/types';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface GetAdminResponse {
  data?: Admin;
  error?: string;
}

export async function GET() {
  const response: GetAdminResponse = {};
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
    if (user.role !== 'admin') {
      response.error = 'not authorized';
      return NextResponse.json(response, { status: 403 })
    }
    const users = await findAllUsers();
    const documents = await findAllDocuments();
    response.data = {
      users: JSON.parse(JSON.stringify(users)),
      documents: JSON.parse(JSON.stringify(documents)),
    };
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}
