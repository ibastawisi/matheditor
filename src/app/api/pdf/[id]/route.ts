import { GetCloudDocumentResponse } from "@/types";
import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const publicUrl = process.env.PUBLIC_URL;
    const pdfWorkerUrl = process.env.PDF_WORKER_URL;
    if (!publicUrl || !pdfWorkerUrl) return NextResponse.json({ error: "Please set PUBLIC_URL and PDF_WORKER_URL Env Variables" }, { status: 500 });
    const url = new URL(request.url.replace(publicUrl, pdfWorkerUrl));
    const handle = url.pathname.split("/").pop();
    const res = await fetch(`${publicUrl}/api/documents/${handle}/metadata`);
    const { data, error } = await res.json() as GetCloudDocumentResponse;
    if (error || !data || data.private) return fetch(request.url.replace('/pdf', '/embed'));
    const revision = url.searchParams.get('v');
    if (!revision) url.searchParams.set('v', data?.head || "");
    const response = await fetch(url.toString(), { cache: 'force-cache' });
    return response;
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: { title: "Something went wrong", subtitle: "Please try again later" } }, { status: 500 });
  }
}

