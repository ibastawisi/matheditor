import { findDocumentId } from "@/repositories/document";
import { generateHtml } from "@/editor/utils/generateHtml";
import htmr from 'htmr';
import EmbedDocument from "@/components/EmbedDocument";
import { notFound } from 'next/navigation'
import { findDocumentHeadRevision } from "@/repositories/revision";

export default async function Page({ params }: { params: { id: string } }) {
  const documentId = await findDocumentId(params.id);
  if (!documentId) notFound();
  const revision = await findDocumentHeadRevision(documentId);
  if (!revision) notFound();
  const html = await generateHtml(revision.data);
  const children = htmr(html);

  return <EmbedDocument>{children}</EmbedDocument>
}