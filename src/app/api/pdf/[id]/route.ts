import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url.replace(process.env.PUBLIC_URL!, process.env.PDF_WORKER_URL!));
    const handle = url.pathname.split("/").pop();
    const res = await fetch(`${process.env.PUBLIC_URL}/api/documents/${handle}/head`);
    const { data } = await res.json();
    if (!data) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    const revision = url.searchParams.get('v');
    if (!revision) url.searchParams.set('v', data);
    const response = await fetch(url.toString(), { cache: 'force-cache' });
    return response;
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

