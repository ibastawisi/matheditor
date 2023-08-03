import { authOptions } from '@/lib/auth';
import { findAllUsers } from '@/repositories/user';
import { User } from '@/types';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export interface GetUsersResponse {
  data?: User[];
  error?: string;
}

export async function GET() {
  const response: GetUsersResponse = {};
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
    response.data = users as unknown as User[];
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}
