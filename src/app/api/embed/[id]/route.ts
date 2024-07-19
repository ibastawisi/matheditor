import { generateServerHtml } from "@/editor/utils/generateServerHtml";
import { findRevisionById } from "@/repositories/revision";
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const revision = await findRevisionById(params.id);
    if (!revision) {
      return NextResponse.json({ error: { title: "Something went wrong", subtitle: "Revision not found" } }, { status: 404 })
    }
    const html = await generateServerHtml(revision.data);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: { title: "Something went wrong", subtitle: "Please try again later" } }, { status: 500 })
  }
}

