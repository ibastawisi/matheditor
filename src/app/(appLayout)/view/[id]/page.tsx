import type { OgMetadata } from "@/app/api/og/route";
import { findUserDocument } from "@/repositories/document";
import ViewDocument from "@/components/ViewDocument";
import htmr from 'htmr';
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SplashScreen from "@/components/SplashScreen";
import { cache } from "react";

const getCachedUserDocument = cache(async (id: string, revisions?: string) => await findUserDocument(id, revisions));

export async function generateMetadata({ params, searchParams }: { params: { id: string }, searchParams: { v?: string } }): Promise<Metadata> {
  if (!params.id) return {
    title: "View Document | Math Editor",
    description: "View a document on Math Editor",
  };
  const metadata: OgMetadata = { id: params.id, title: 'Math Editor' };
  const document = await getCachedUserDocument(params.id, "all");
  if (document) {
    const revisionId = searchParams.v ?? document.head;
    const revision = document.revisions.find((revision) => revision.id === revisionId);
    if (document.private) {
      metadata.title = 'Private Document | Math Editor';
      metadata.subtitle = 'If you have access, please sign in to view it';
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
  const document = await getCachedUserDocument(params.id, "all");
  if (!document) notFound();
  const revisionId = searchParams.v ?? document.head;
  const revision = document.revisions.find((revision) => revision.id === revisionId);
  if (!revision) notFound();
  document.updatedAt = revision.createdAt;
  const session = await getServerSession(authOptions);
  const isCollab = document.collab;
  if (!session) {
    if (document.private) return <SplashScreen title="This document is private" subtitle="Please sign in to view it" />
    if (!isCollab) document.revisions = [revision];
  }
  const user = session?.user;
  if (user) {
    const isAuthor = user.id === document.author.id;
    const isCoauthor = document.coauthors.some(coauthor => coauthor.id === user.id);
    if (!isAuthor && !isCoauthor) {
      if (document.private) return <SplashScreen title="This document is private" subtitle="You are not authorized to view this document" />
      if (!isCollab) document.revisions = [revision];
    }
  }
  const response = await fetch(`${process.env.PUBLIC_URL}/api/embed/${revisionId}`);
  if (!response.ok) throw new Error('Failed to generate HTML');
  const html = await response.text();
  return <ViewDocument cloudDocument={document} user={session?.user}>{htmr(html)}</ViewDocument>;
}