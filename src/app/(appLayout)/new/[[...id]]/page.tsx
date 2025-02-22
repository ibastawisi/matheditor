import NewDocument from "@/components/NewDocument";
import type { OgMetadata } from "@/app/api/og/route";
import { findUserDocument } from "@/repositories/document";
import type { Metadata } from "next";
import { cache } from "react";
import { ThumbnailProvider } from "@/app/context/ThumbnailContext";
import { findRevisionThumbnail } from "@/app/api/utils";
import SplashScreen from "@/components/SplashScreen";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const getCachedUserDocument = cache(async (id: string, revisions?: string) => await findUserDocument(id, revisions));
const getCachedSession = cache(async () => await getServerSession(authOptions));

export async function generateMetadata(
  props: { params: Promise<{ id: string }>, searchParams: Promise<{ v?: string }> }
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const params = await props.params;
  if (!(params.id && params.id[0])) return {
    title: "New Document",
    description: "Create a new document on Math Editor",
  };
  const metadata: OgMetadata = { id: params.id[0], title: 'Math Editor' };
  const document = await getCachedUserDocument(params.id[0], searchParams.v);
  if (document) {
    if (document.collab || document.published) {
      metadata.title = `Fork ${document.name}`;
      metadata.subtitle = `Last updated: ${new Date(document.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} (UTC)`;
      metadata.user = { name: document.author.name, image: document.author.image!, email: document.author.email };
    } else {
      metadata.title = 'Fork a Document';
    }
  } else {
    metadata.title = 'Fork a Document';
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
  props: { params: Promise<{ id?: string }>, searchParams: Promise<{ v?: string }> }
) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const documentId = params.id?.[0];
  if (!documentId) return <NewDocument />;
  const document = await getCachedUserDocument(documentId, searchParams.v);
  if (!document) return <NewDocument />;
  const isPublished = document.published;
  const isPrivate = document.private;
  const isCollab = document.collab;
  const session = await getCachedSession();
  if (!session && !isPublished && !isCollab) return <SplashScreen title="This document is not published" subtitle="Please sign in to Fork it" />
  const user = session && session.user;
  const isAuthor = user && user.id === document.author.id;
  const isCoauthor = user && document.coauthors.some(coauthor => coauthor.id === user.id);
  if (user && !isAuthor && !isCoauthor) {
    if (isPrivate) return <SplashScreen title="This document is private" subtitle="You are not authorized to Fork this document" />
    if (!isPublished && !isCollab) return <SplashScreen title="This document is not published" subtitle="You are not authorized to Fork this document" />
  }
  const revisionId = searchParams.v || document.head;
  const thumbnails = {
    [revisionId]: findRevisionThumbnail(revisionId),
  };
  return (
    <ThumbnailProvider thumbnails={thumbnails}>
      <NewDocument cloudDocument={document} />
    </ThumbnailProvider>
  );
} 
