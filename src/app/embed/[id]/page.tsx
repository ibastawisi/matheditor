import htmr from 'htmr';
import EmbedDocument from "@/components/EmbedDocument";
import { notFound } from 'next/navigation'
import { findUserDocument } from '@/repositories/document';

export default async function Page({ params, searchParams }: { params: { id: string }, searchParams: { [key: string]: string | string[] | undefined } }) {
  const document = await findUserDocument(params.id);
  if (!document) notFound();
  if (document.private) throw new Error('This document is private');
  const revision = searchParams["v"] ?? document.head
  const response = await fetch(`${process.env.PUBLIC_URL}/api/embed/${revision}`);
  if (!response.ok) throw new Error('Failed to generate HTML');
  const html = await response.text();
  return <EmbedDocument>{htmr(html)}</EmbedDocument>
}