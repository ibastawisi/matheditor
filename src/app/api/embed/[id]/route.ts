import { generateHtml } from "@/editor/utils/generateHtml";
import { findRevisionById } from "@/repositories/revision";
import { parseHTML } from "linkedom";
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const revision = await findRevisionById(params.id);
    if (!revision) {
      return NextResponse.json({ error: { title: "Something went wrong", subtitle: "Revision not found" } }, { status: 404 })
    }
    
    if (typeof window === "undefined") {
      const dom = parseHTML("<!DOCTYPE html><html><head></head><body></body></html>");
      global = dom;
      global.document = dom.document;
      global.DocumentFragment = dom.DocumentFragment;
      global.Element = dom.Element;
    }

    const html = await generateHtml(revision.data);
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

