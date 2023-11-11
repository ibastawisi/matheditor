import htmr from 'htmr';
import EmbedDocument from "@/components/EmbedDocument";
import { notFound } from 'next/navigation'
import { findUserDocument } from '@/repositories/document';

export default async function Page({ params }: { params: { id: string } }) {
  const document = await findUserDocument(params.id);
  if (!document) notFound();
  const response = await fetch(`${process.env.PUBLIC_URL}/api/embed/${document.head}`);
  if (!response.ok) throw new Error('Failed to generate HTML');
  const html = await response.text();
  return <EmbedDocument>{htmr(html)}</EmbedDocument>
}