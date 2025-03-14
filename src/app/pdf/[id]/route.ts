import { findUserDocument } from "@/repositories/document";

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
    url.pathname = `/api/pdf/${handle}`;
    if (url.hostname === 'localhost') url.protocol = 'http:';
    const response = await fetch(url.toString(), { cache: 'force-cache', next: { tags: ['pdf'] } });
    if (!response.ok) throw new Error("Couldn't generate PDF");
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(document.name)}.pdf"`
      }
    });
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

