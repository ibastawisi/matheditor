import { authOptions } from "@/lib/auth";
import { findUserById, updateUser, deleteUser, findUserIdByHandle } from "@/repositories/user";
import { DeleteUserResponse, GetUserResponse, PatchUserResponse } from "@/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { validate } from "uuid";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const response: GetUserResponse = {};
  try {
    const isValidId = validate(params.id);
    if (!isValidId) {
      try {
        const id = await findUserIdByHandle(params.id);
        if (id) params.id = id;
        else {
          response.error = "User not found";
          return NextResponse.json(response, { status: 404 })
        }
      } catch (error) {
        response.error = "User not found";
        return NextResponse.json(response, { status: 404 })
      }
    }
    const user = await findUserById(params.id);
    if (!user) {
      response.error = "User Not found";
      return NextResponse.json(response, { status: 404 })
    }
    response.data = {
      id: user.id,
      handle: user.handle,
      name: user.name,
      email: user.email,
      image: user.image
    };
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "Something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const response: PatchUserResponse = {};
  try {
    if (!validate(params.id)) {
      response.error = "Invalid id";
      return NextResponse.json(response, { status: 400 })
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = "Not authenticated";
      return NextResponse.json(response, { status: 401 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = "Account is disabled for violating terms of service";
      return NextResponse.json(response, { status: 403 })
    }
    if (user.id !== params.id) {
      response.error = "Unauthorized";
      return NextResponse.json(response, { status: 403 })
    }
    const body = await request.json();
    if (!body) {
      response.error = "Bad input";
      return NextResponse.json(response, { status: 400 })
    }
    if (body.handle) {
      body.handle = body.handle.toLowerCase();
      const errors = await validateHandle(params.id, body.handle);
      if (errors) {
        response.error = errors;
        return NextResponse.json(response, { status: 400 })
      }
    }

    const result = await updateUser(params.id, {
      handle: body.handle,
    });

    response.data = {
      id: result.id,
      handle: result.handle,
      name: result.name,
      email: result.email,
      image: result.image
    };

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "Something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const response: DeleteUserResponse = {};
  try {
    if (!validate(params.id)) {
      response.error = "Invalid id";
      return NextResponse.json(response, { status: 400 })
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = "Not authenticated, please login";
      return NextResponse.json(response, { status: 401 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = "Account is disabled for violating terms of service";
      return NextResponse.json(response, { status: 403 })
    }
    if (user.role !== "admin") {
      response.error = "Not authorized";
      return NextResponse.json(response, { status: 403 })
    }
    await deleteUser(params.id);
    response.data = params.id;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "Something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}

const validateHandle = async (id: string, handle: string) => {
  if (handle.length < 3) {
    return "Handle must be at least 3 characters long";
  }
  if (!/^[a-zA-Z0-9-]+$/.test(handle)) {
    return "Handle must only contain letters, numbers, and dashes";
  }
  const handleId = await findUserIdByHandle(handle);
  if (handleId && handleId !== id) {
    return "Handle is already taken";
  }
  return null;
}