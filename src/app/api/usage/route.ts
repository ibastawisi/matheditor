import { authOptions } from "@/lib/auth";
import { findCloudStorageUsageByAuthorId } from "@/repositories/document";
import { GetDocumentStorageUsageResponse } from "@/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const response: GetDocumentStorageUsageResponse = {};
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      response.data = [];
      return NextResponse.json(response, { status: 200 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = { title: "Account Disabled", subtitle: "Account is disabled for violating terms of service" }
      return NextResponse.json(response, { status: 403 })
    }
    const cloudStorageUsage = await findCloudStorageUsageByAuthorId(user.id);
    response.data = cloudStorageUsage;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = { title: "Something went wrong", subtitle: "Please try again later" }
    return NextResponse.json(response, { status: 500 })
  }
}