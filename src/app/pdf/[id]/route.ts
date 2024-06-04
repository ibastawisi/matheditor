import { findUserDocument } from "@/repositories/document";

const PDF_WORKER_URL = process.env.PDF_WORKER_URL;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams;
    const handle = url.pathname.split("/").pop()?.split(".pdf")[0];
    const revision = search.get('v');
    if (!handle) throw new Error("No handle provided");
    const document = await findUserDocument(handle, revision);
    if (!document || document.private) throw new Error("Document not found");
    if (!revision) url.searchParams.set('v', document.head);
    if (PDF_WORKER_URL) {
      url.hostname = PDF_WORKER_URL;
      url.port = '';
      url.pathname = url.pathname.split(".pdf")[0];
    }
    else url.pathname = `/api/pdf/${handle}`;
    if (url.hostname === 'localhost') url.protocol = 'http:';
    const response = await fetch(url.toString(), { cache: 'force-cache' });
    if (!response.ok) throw new Error("Couldn't generate PDF");
    response.headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(document.name)}.pdf"`);
    return response;
  } catch (error) {
    console.error(error);
    const url = new URL(request.url);
    if (url.hostname === 'localhost') url.protocol = 'http:';
    url.pathname = url.pathname.replace('/pdf', '/embed').split(".pdf")[0];
    const response = await fetch(url.toString());
    const html = await response.text();
    return new Response(html, { status: response.status, headers: { "Content-Type": "text/html" } });
  }
}

