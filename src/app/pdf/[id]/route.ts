import { GetCloudDocumentResponse } from "@/types";
import { NextResponse } from "next/server";

const PUBLIC_URL = process.env.PUBLIC_URL;
const PDF_WORKER_URL = process.env.PDF_WORKER_URL;

export async function GET(request: Request) {
  try {
    if (!PUBLIC_URL) return NextResponse.json({ error: { title: "Something went wrong", subtitle: "Please set up the environment variable PUBLIC_URL" }, }, { status: 500 });
    const url = new URL(request.url);
    const search = url.searchParams;
    const handle = url.pathname.split("/").pop();
    const revision = search.get('v');

    const metadata = await fetch(`${PUBLIC_URL}/api/documents/${handle}/metadata`);
    const { data, error } = await metadata.json() as GetCloudDocumentResponse;
    if (error || !data || data.private) return fetch(request.url.replace('/pdf', '/embed'));
    const name = data.name;
    if (!revision) url.searchParams.set('v', data?.head || "");
    if (PDF_WORKER_URL) url.hostname = PDF_WORKER_URL;
    else url.pathname = `/api/pdf/${handle}`;
    const response = await fetch(url.toString(), { cache: 'force-cache' });
    response.headers.set("Content-Disposition", `inline; filename="${name}.pdf"`);
    return response;
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: { title: "Something went wrong", subtitle: "Please try again later" } }, { status: 500 });
  }
}

