import type { OgMetadata } from "@/app/api/og/route";
import { findUserDocument } from "@/repositories/document";
import ViewDocument from "@/components/ViewDocument";
import htmr from 'htmr';
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SplashScreen from "@/components/SplashScreen";
import { cache } from "react";
import { findRevisionHtml } from "@/app/api/utils";

const getCachedUserDocument = cache(async (id: string, revisions?: string) => await findUserDocument(id, revisions));
const getCachedSession = cache(async () => await getServerSession(authOptions));

export async function generateMetadata(
  props: { params: Promise<{ id: string }>, searchParams: Promise<{ v?: string }> }
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const params = await props.params;
  if (!params.id) return {
    title: "View Document",
    description: "View a document on Math Editor",
  };
  const metadata: OgMetadata = { id: params.id, title: 'View Document' };
  const document = await getCachedUserDocument(params.id, "all");
  if (document) {
    const revisionId = searchParams.v ?? document.head;
    const revision = document.revisions.find((revision) => revision.id === revisionId);
    if (document.private) {
      const session = await getCachedSession();
      const user = session?.user;
      const isAuthor = user && user.id === document.author.id;
      const isCoauthor = user && document.coauthors.some(coauthor => coauthor.id === user.id);
      if (isAuthor || isCoauthor) {
        metadata.title = document.name;
        metadata.subtitle = revision ? `Last updated: ${new Date(revision.createdAt).toLocaleString()}` : 'Revision not Found'
        metadata.user = { name: document.author.name, image: document.author.image!, email: document.author.email };
      } else {
        metadata.title = 'Private Document';
        metadata.subtitle = 'If you have access, please sign in to view it';
      }
    } else {
      metadata.title = document.name;
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

export default async function Page(
  props: { params: Promise<{ id: string }>, searchParams: Promise<{ v?: string }> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  try {
    const document = await getCachedUserDocument(params.id, "all");
    if (!document) return <SplashScreen title="Document not found" />;
    const revisionId = searchParams.v ?? document.head;
    const revision = document.revisions.find((revision) => revision.id === revisionId);
    if (!revision) return <SplashScreen title="Something went wrong" subtitle="Revision not found" />;
    document.updatedAt = revision.createdAt;
    const session = await getCachedSession();
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
    const html = await findRevisionHtml(revisionId);
    return <ViewDocument cloudDocument={document} user={session?.user}>{htmr(html)}</ViewDocument>;
  } catch (error) {
    console.error(error);
    return <SplashScreen title="Something went wrong" subtitle="Please try again later" />;
  }
}