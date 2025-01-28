import NewDocument from "@/components/NewDocument";
import type { OgMetadata } from "@/app/api/og/route";
import { findUserDocument } from "@/repositories/document";
import type { Metadata } from "next";
import { cache } from "react";
import { ThumbnailProvider } from "@/app/context/ThumbnailContext";
import { findRevisionThumbnail } from "@/app/api/utils";

const getCachedUserDocument = cache(async (id: string, revisions?: string) => await findUserDocument(id, revisions));

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
      metadata.subtitle = `Last updated: ${new Date(document.updatedAt).toLocaleString()}`;
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
  const userDocument = await getCachedUserDocument(documentId, searchParams.v);
  if (!userDocument) return <NewDocument />;
  const revisionId = searchParams.v || userDocument.head;
  const thumbnails = {
    [revisionId]: findRevisionThumbnail(revisionId),
  };
  return (
    <ThumbnailProvider thumbnails={thumbnails}>
      <NewDocument cloudDocument={userDocument} />
    </ThumbnailProvider>
  );
} 
