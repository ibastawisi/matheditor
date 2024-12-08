import { authOptions } from "@/lib/auth";
import { findUser, updateUser, deleteUser } from "@/repositories/user";
import { DeleteUserResponse, GetUserResponse, PatchUserResponse, UserUpdateInput } from "@/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { validate } from "uuid";
import { Prisma } from "@/lib/prisma";
import { validateHandle } from "../utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const response: GetUserResponse = {};
  try {
    const user = await findUser(params.id);
    if (!user) {
      response.error = { title: "User not found" }
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
    response.error = { title: "Something went wrong", subtitle: "Please try again later" }
    return NextResponse.json(response, { status: 500 })
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const response: PatchUserResponse = {};
  try {
    if (!validate(params.id)) {
      response.error = { title: "Bad Request", subtitle: "Invalid user id" }
      return NextResponse.json(response, { status: 400 })
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = { title: "Unauthenticated", subtitle: "Please sign in to update your profile" }
      return NextResponse.json(response, { status: 401 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = { title: "Account Disabled", subtitle: "Account is disabled for violating terms of service" }
      return NextResponse.json(response, { status: 403 })
    }
    if (user.id !== params.id) {
      response.error = { title: "Unauthorized", subtitle: "You are not authorized to update this profile" }
      return NextResponse.json(response, { status: 403 })
    }
    const body: UserUpdateInput = await request.json();
    if (!body) {
      response.error = { title: "Bad Request", subtitle: "No update provided" }
      return NextResponse.json(response, { status: 400 })
    }

    const input: Prisma.UserUncheckedUpdateInput = {};
    if (body.handle && body.handle !== user.handle) {
      input.handle = body.handle.toLowerCase();
      const validationError = await validateHandle(input.handle);
      if (validationError) {
        response.error = validationError;
        return NextResponse.json(response, { status: 400 })
      }
    }

    const result = await updateUser(params.id, input);

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
    response.error = { title: "Something went wrong", subtitle: "Please try again later" }
    return NextResponse.json(response, { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const response: DeleteUserResponse = {};
  try {
    if (!validate(params.id)) {
      response.error = { title: "Bad Request", subtitle: "Invalid user id" }
      return NextResponse.json(response, { status: 400 })
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = { title: "Unauthenticated", subtitle: "Please sign in to delete this user" }
      return NextResponse.json(response, { status: 401 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = { title: "Account Disabled", subtitle: "Account is disabled for violating terms of service" }
      return NextResponse.json(response, { status: 403 })
    }
    if (user.role !== "admin") {
      response.error = { title: "Unauthorized", subtitle: "You are not authorized to delete this user" }
      return NextResponse.json(response, { status: 403 })
    }
    await deleteUser(params.id);
    response.data = params.id;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = { title: "Something went wrong", subtitle: "Please try again later" }
    return NextResponse.json(response, { status: 500 })
  }
}