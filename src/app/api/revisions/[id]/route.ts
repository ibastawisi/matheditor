import { authOptions } from "@/lib/auth";
import { deleteRevision, findRevisionAuthorId, findRevisionById } from "@/repositories/revision";
import { DeleteRevisionResponse, GetRevisionResponse } from "@/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const response: GetRevisionResponse = {};
  try {
    const revision = await findRevisionById(params.id);
    if (!revision) {
      response.error = "Revision not found";
      return NextResponse.json(response, { status: 404 })
    }
    response.data = revision as unknown as GetRevisionResponse["data"];
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "Something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const response: DeleteRevisionResponse = {};
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = "Not authenticated, please login"
      return NextResponse.json(response, { status: 401 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = "Account is disabled for violating terms of service";
      return NextResponse.json(response, { status: 403 })
    }
    const authorId = await findRevisionAuthorId(params.id);
    if (user.id !== authorId) {
      response.error = "You don't have permission to delete this revision";
      return NextResponse.json(response, { status: 403 })
    }
    const revision = await deleteRevision(params.id);
    response.data = {
      id: revision.id,
      documentId: revision.documentId,
    }
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = "Something went wrong";
    return NextResponse.json(response, { status: 500 })
  }
}
