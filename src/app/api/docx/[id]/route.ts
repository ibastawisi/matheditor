import { generateDocx } from "@/editor/utils/generateDocx";
import { getCachedRevision } from "@/repositories/revision";
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams;
  const revisionId = search.get('v')!;

  try {
    const revision = await getCachedRevision(revisionId);
    if (!revision) {
      return NextResponse.json({ error: { title: "Something went wrong", subtitle: "Revision not found" } }, { status: 404 })
    }
    const blob = await generateDocx(revision.data);
    return new Response(blob, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `inline; filename="${encodeURIComponent(revision.id)}.docx"`
      },
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: { title: "Something went wrong", subtitle: "Please try again later" } }, { status: 500 })
  }
}

