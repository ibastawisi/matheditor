import { generateHtml } from "@/editor/utils/generateHtml";
import { findRevisionById } from "@/repositories/revision";
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const revision = await findRevisionById(params.id);
    if (!revision) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    const html = await generateHtml(revision.data);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

