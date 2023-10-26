import { generateHtml } from "@/editor/utils/generateHtml";
import htmr from 'htmr';
import EmbedDocument from "@/components/EmbedDocument";
import { notFound } from 'next/navigation'
import { findDocumentHeadRevision } from "@/repositories/revision";

export default async function Page({ params }: { params: { id: string } }) {
  const revision = await findDocumentHeadRevision(params.id);
  if (!revision) notFound();
  const html = await generateHtml(revision.data);
  return <EmbedDocument>{htmr(html)}</EmbedDocument>
}