import { OgMetadata } from "@/app/api/og/route";
import type { Metadata } from "next";
import { findPublishedDocumentsByAuthorId } from "@/repositories/document";
import { notFound } from "next/navigation";
import { findUser } from "@/repositories/user";
import { cache, Suspense } from "react";
import UserCard from "@/components/User/UserCard";
import UserDocuments from "@/components/User/UserDocuments";
import { findRevisionThumbnail } from "@/app/api/utils";
import { ThumbnailProvider } from "@/app/context/ThumbnailContext";
import { sortDocuments } from "@/components/DocumentControls/sortDocuments";

const getCachedUser = cache(async (id: string) => await findUser(id));
const getCachedUserDocuments = cache(async (id: string) => await findPublishedDocumentsByAuthorId(id));

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const metadata: OgMetadata = { id: params.id, title: 'Math Editor' };
  const user = await getCachedUser(params.id);
  if (user) {
    metadata.title = user.name;
    metadata.subtitle = `Member since: ${new Date(user.createdAt).toDateString()}`
    metadata.user = { name: user.name, image: user.image!, email: user.email };
  } else {
    metadata.subtitle = 'User not found';
  }

  const { title, subtitle, description } = metadata;
  const image = `/api/og?metadata=${encodeURIComponent(JSON.stringify(metadata))}`;

  return {
    title,
    description: description ?? subtitle,
    openGraph: {
      images: [image],
    },
  }
}

const UserCardWrapper = async ({ id }: { id: string }) => {
  const user = await getCachedUser(id);
  if (!user) notFound();
  return <UserCard user={user} />;
}

const UserDocumentsWrapper = async ({ id, page, sortKey, sortDirection }: { id: string, page: string, sortKey: string, sortDirection: "asc" | "desc" }) => {
  const user = await getCachedUser(id);
  if (!user) notFound();
  const documentsResponse = await getCachedUserDocuments(user.id);
  const documents = documentsResponse.map(document => ({ id: document.id, cloud: document }));
  const pageSize = 12;
  const pages = Math.ceil(documents.length / pageSize);
  const sortedDocuments = sortDocuments(documents, sortKey, sortDirection);
  const currentPage = Math.min(Math.max(1, parseInt(page)), pages);
  const pageDocuments = sortedDocuments.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const thumbnails = pageDocuments.reduce((acc, document) => {
    acc[document.cloud!.head] = findRevisionThumbnail(document.cloud!.head);
    return acc;
  }, {} as Record<string, Promise<string | null>>);

  return (
    <ThumbnailProvider thumbnails={thumbnails}>
      <UserDocuments documents={pageDocuments} pages={pages} />
    </ThumbnailProvider>
  );
}

export default async function Page(
  props: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ page?: string, sortKey?: string, sortDirection?: "asc" | "desc" }>
  }
) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  return (
    <>
      <Suspense fallback={<UserCard />}>
        <UserCardWrapper id={params.id} />
      </Suspense>
      <Suspense fallback={<UserDocuments />}>
        <UserDocumentsWrapper
          id={params.id}
          page={searchParams.page || '1'}
          sortKey={searchParams.sortKey || 'updatedAt'}
          sortDirection={searchParams.sortDirection || 'desc'}
        />
      </Suspense>
    </>
  );
}