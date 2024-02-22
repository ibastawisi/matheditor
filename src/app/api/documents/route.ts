import { authOptions } from "@/lib/auth";
import { createDocument, findDocumentsByAuthorId, findPublishedDocuments, findUserDocument } from "@/repositories/document";
import { DocumentCreateInput, GetDocumentsResponse, PostDocumentsResponse } from "@/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Prisma } from "@/lib/prisma"
import { validateHandle } from "./utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const response: GetDocumentsResponse = {};
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      const publishedDocuments = await findPublishedDocuments();
      response.data = publishedDocuments;
      return NextResponse.json(response, { status: 200 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = { title: "Account Disabled", subtitle: "Account is disabled for violating terms of service" }
      return NextResponse.json(response, { status: 403 })
    }
    const documents = await findDocumentsByAuthorId(user.id);
    response.data = documents;
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = { title: "Something went wrong", subtitle: "Please try again later" }
    return NextResponse.json(response, { status: 500 })
  }
}

export async function POST(request: Request) {
  const response: PostDocumentsResponse = {};
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = { title: "Unauthorized", subtitle: "Please sign in to save your document to the cloud" }
      return NextResponse.json(response, { status: 401 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = { title: "Account Disabled", subtitle: "Account is disabled for violating terms of service" }
      return NextResponse.json(response, { status: 403 })
    }
    const body = await request.json() as DocumentCreateInput;
    if (!body) {
      response.error = { title: "Bad Request", subtitle: "No document provided" }
      return NextResponse.json(response, { status: 400 })
    }

    const userDocument = await findUserDocument(body.id);
    if (userDocument) {
      response.error = { title: "Unauthorized", subtitle: "A document with this id already exists" }
      return NextResponse.json(response, { status: 403 })
    }

    const input: Prisma.DocumentUncheckedCreateInput = {
      id: body.id,
      authorId: user.id,
      name: body.name,
      createdAt: body.createdAt,
      updatedAt: body.updatedAt,
      head: body.head,
      published: body.published,
      collab: body.collab,
      private: body.private,
      revisions: {
        create: {
          id: body.head || undefined,
          data: body.data as unknown as Prisma.JsonObject,
          authorId: user.id,
          createdAt: body.updatedAt,
        }
      }
    };
    if (body.handle) {
      input.handle = body.handle.toLowerCase();
      const validationError = await validateHandle(input.handle);
      if (validationError) {
        response.error = validationError;
        return NextResponse.json(response, { status: 400 })
      }
    }
    if (body.coauthors) {
      const documentId = body.id;
      const userEmails = body.coauthors as string[];
      input.coauthors = {
        connectOrCreate: userEmails.map(userEmail => ({
          where: { documentId_userEmail: { documentId, userEmail } },
          create: {
            user: {
              connectOrCreate: {
                where: { email: userEmail },
                create: {
                  name: userEmail.split("@")[0],
                  email: userEmail,
                },
              }
            }
          }
        })),
      };
    }

    if (body.baseId) {
      const baseDocument = await findUserDocument(body.baseId);
      if (baseDocument) input.baseId = body.baseId;
    }
    
    response.data = await createDocument(input);
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = { title: "Something went wrong", subtitle: "Please try again later" }
    return NextResponse.json(response, { status: 500 })
  }
}
