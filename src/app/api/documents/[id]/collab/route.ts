import { authOptions } from "@/lib/auth";
import { getCollabConfig, signCollabToken } from "@/lib/collab";
import { createCollabState, hasCollabState } from "@/repositories/collab";
import { findEditorDocument, findUserDocument } from "@/repositories/document";
import { createYjsState } from "@/editor/utils/createYjsState";
import { PostCollabSessionInput, PostCollabSessionResponse } from "@/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { validate } from "uuid";
import type { SerializedEditorState } from "lexical";

export const dynamic = "force-dynamic";

/** A copy sent by the client that does not parse starts nothing */
function tryCreateYjsState(data: SerializedEditorState) {
  try {
    return createYjsState(data);
  } catch (error) {
    console.log(error);
    return null;
  }
}

/**
 * Lets the signed-in user join the live session of a document they can edit.
 * The first time, the session starts from the document's head revision, or
 * from the copy the client sent when that was changed after the document was
 * last saved, so that unsaved changes on the device that starts it carry over.
 */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const response: PostCollabSessionResponse = {};
  try {
    const config = getCollabConfig();
    if (!config) {
      response.error = { title: "Live editing is not available" }
      return NextResponse.json(response, { status: 503 })
    }
    if (!validate(params.id)) {
      response.error = { title: "Bad Request", subtitle: "Invalid id" }
      return NextResponse.json(response, { status: 400 })
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      response.error = { title: "Unauthorized", subtitle: "Please sign in to edit this document live" }
      return NextResponse.json(response, { status: 401 })
    }
    const { user } = session;
    if (user.disabled) {
      response.error = { title: "Account Disabled", subtitle: "Account is disabled for violating terms of service" }
      return NextResponse.json(response, { status: 403 })
    }
    const userDocument = await findUserDocument(params.id);
    if (!userDocument) {
      response.error = { title: "Document not found" }
      return NextResponse.json(response, { status: 404 })
    }
    const isAuthor = user.id === userDocument.author.id;
    const isCoauthor = userDocument.coauthors.some(coauthor => coauthor.id === user.id);
    if (!isAuthor && !isCoauthor && !userDocument.collab) {
      response.error = { title: "This document is private", subtitle: "You are not authorized to Edit this document" }
      return NextResponse.json(response, { status: 403 })
    }
    let seededFromCopy = false;
    if (!await hasCollabState(params.id)) {
      const copy: PostCollabSessionInput = await request.json().catch(() => ({}));
      const isNewerCopy = !!copy.data?.root && !!copy.updatedAt && new Date(copy.updatedAt) > new Date(userDocument.updatedAt);
      const copyState = isNewerCopy ? tryCreateYjsState(copy.data!) : null;
      if (copyState) {
        seededFromCopy = await createCollabState(params.id, copyState);
      } else {
        const editorDocument = await findEditorDocument(params.id);
        if (!editorDocument) {
          response.error = { title: "Document not found" }
          return NextResponse.json(response, { status: 404 })
        }
        await createCollabState(params.id, createYjsState(editorDocument.data));
      }
    }
    response.data = {
      url: config.url,
      token: signCollabToken(config.secret, params.id, user.id),
      user: { id: user.id, name: user.name, image: user.image },
      seededFromCopy,
    };
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.log(error);
    response.error = { title: "Something went wrong", subtitle: "Please try again later" }
    return NextResponse.json(response, { status: 500 })
  }
}
