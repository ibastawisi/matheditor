import { findUserDocument } from "@/repositories/document";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams;
    const handle = url.pathname.split("/").pop()?.split(".docx")[0];
    const revision = search.get('v');
    if (!handle) throw new Error("No handle provided");
    const document = await findUserDocument(handle, revision);
    if (!document || document.private) throw new Error("Document not found");
    if (!revision) url.searchParams.set('v', document.head);
    url.pathname = `/api/docx/${handle}`;
    if (url.hostname === 'localhost') url.protocol = 'http:';
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("Couldn't generate DOCx");
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `inline; filename="${encodeURIComponent(document.name)}.docx"`
      }
    });
  } catch (error) {
    console.error(error);
    const url = new URL(request.url);
    if (url.hostname === 'localhost') url.protocol = 'http:';
    url.pathname = url.pathname.replace('/docx', '/embed').split(".docx")[0];
    const response = await fetch(url.toString(), { cache: 'force-cache' });
    const html = await response.text();
    return new Response(html, { status: response.status, headers: { "Content-Type": "text/html" } });
  }
}

