import type { OgMetadata } from "@/app/api/og/route";
import htmr from 'htmr';
import EmbedDocument from "@/components/EmbedDocument";
import { notFound } from 'next/navigation'
import { findUserDocument } from '@/repositories/document';
import SplashScreen from '@/components/SplashScreen';
import { cache } from 'react';
import type { Metadata } from "next";

const getCachedUserDocument = cache(async (id: string, revisions?: string) => await findUserDocument(id, revisions));

export async function generateMetadata({ params, searchParams }: { params: { id: string }, searchParams: { v?: string } }): Promise<Metadata> {
  if (!params.id) return {
    title: "Embed Document | Math Editor",
    description: "Embed a document on Math Editor",
  };
  const metadata: OgMetadata = { id: params.id, title: 'Math Editor' };
  const document = await getCachedUserDocument(params.id, searchParams.v);
  if (document) {
    const revisionId = searchParams.v ?? document.head;
    const revision = document.revisions.find((revision) => revision.id === revisionId);
    if (document?.private) {
      metadata.title = 'Private Document | Math Editor';
    } else {
      metadata.title = `${document.name} | Math Editor`;
      metadata.subtitle = revision ? `Last updated: ${new Date(revision.createdAt).toLocaleString()}` : 'Revision not Found'
      metadata.user = { name: document.author.name, image: document.author.image!, email: document.author.email };
    }
  } else {
    metadata.subtitle = 'Document not found';
  }
  const { title, subtitle, description } = metadata;
  const image = `/api/og?metadata=${encodeURIComponent(JSON.stringify(metadata))}`;

  return {
    title: `${title}`,
    description: description ?? subtitle,
    openGraph: {
      images: [image],
    },
  }
}

export default async function Page({ params, searchParams }: { params: { id: string }, searchParams: { v?: string } }) {
  const document = await getCachedUserDocument(params.id);
  if (!document) notFound();
  if (document.private) return <SplashScreen title="This document is private" />;
  const revision = searchParams.v ?? document.head
  const response = await fetch(`${process.env.PUBLIC_URL}/api/embed/${revision}`);
  if (!response.ok) throw new Error('Failed to generate HTML');
  const html = await response.text();
  return <EmbedDocument>{htmr(html)}</EmbedDocument>
}