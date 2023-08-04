import { authOptions } from "@/lib/auth";
import { findUserById, updateUser, deleteUser } from "@/repositories/user";
import { User, getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { validate } from "uuid";

export const dynamic = 'force-dynamic';

export interface GetUserResponse {
  data?: User;
  error?: string;
}

export interface PatchUserResponse {
  data?: User;
  error?: string;
}

export interface DeleteUserResponse {
  data?: string;
  error?: string;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const response: GetUserResponse = {};
  try {
    if (!validate(params.id)) {
      response.error = 'invalid id';
      return NextResponse.json(response, { status: 400 })
    }
    const user = await findUserById(params.id);
    if (!user) {
      response.error = 'user not found';
      return NextResponse.json(response, { status: 404 })
    }
    response.data = user as unknown as User;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const response: PatchUserResponse = {};
  try {
    if (!validate(params.id)) {
      response.error = 'invalid id';
      return NextResponse.json(response, { status: 400 })
    }
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
    const body = await request.json();
    if (!body) {
      response.error = 'bad input';
      return NextResponse.json(response, { status: 400 })
    }
    const result = await updateUser(params.id, body);
    response.data = result as unknown as User;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const response: DeleteUserResponse = {};
  try {
    if (!validate(params.id)) {
      response.error = 'invalid id';
      return NextResponse.json(response, { status: 400 })
    }
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
    await deleteUser(params.id);
    response.data = params.id;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}