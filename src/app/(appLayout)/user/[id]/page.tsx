import { OgMetadata } from "@/app/api/og/route";
import type { Metadata } from "next";
import { findPublishedDocumentsByAuthorId } from "@/repositories/document";
import { notFound } from "next/navigation";
import { findUser } from "@/repositories/user";
import { cache, Suspense } from "react";
import UserCard from "@/components/User/UserCard";
import UserDocuments from "@/components/User/UserDocuments";

async function delay<T>(fn: () => Promise<T>, delayMs: number): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return await fn();
}

const getCachedUser = cache(async (id: string) => await findUser(id));

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

const UserDocumentsWrapper = async ({ id }: { id: string }) => {
  const user = await getCachedUser(id);
  if (!user) notFound();
  const documentsResponse = await findPublishedDocumentsByAuthorId(user.id);
  const documents = documentsResponse.map(document => ({ id: document.id, cloud: document }));
  return <UserDocuments documents={documents} />;
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return (
    <>
      <Suspense fallback={<UserCard />}>
        <UserCardWrapper id={params.id} />
      </Suspense>
      <Suspense fallback={<UserDocuments />}>
        <UserDocumentsWrapper id={params.id} />
      </Suspense>
    </>
  );
}