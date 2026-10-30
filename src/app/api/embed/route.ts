import { NextResponse } from "next/server"
import { generateServerHtml } from "@/editor/utils/generateServerHtml";
import { resolveStoredImagesForHtml } from "@/repositories/storage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body) {
      return NextResponse.json({ error: { title: "Invalid request", subtitle: "Please try again later" } }, { status: 400 })
    }
    const resolved = await resolveStoredImagesForHtml(body);
    const html = await generateServerHtml(resolved);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: { title: "Something went wrong", subtitle: "Please try again later" } }, { status: 500 });
  }
}
