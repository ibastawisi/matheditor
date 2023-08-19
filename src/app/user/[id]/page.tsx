import { OgMetadata } from "@/app/api/og/route";
import { findUserById, findUserIdByHandle } from "@/repositories/user";
import type { Metadata } from "next";
import { findPublishedDocumentsByAuthorId } from "@/repositories/document";
import { notFound } from "next/navigation";
import User from "@/components/User";
import { validate } from "uuid";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const metadata: OgMetadata = { id: params.id };
  try {
    const isValidId = validate(params.id);
    if (!isValidId) {
      try {
        const id = await findUserIdByHandle(params.id);
        if (id) params.id = id;
      } catch (error) {
        metadata.title = 'Error 404';
        metadata.subtitle = 'User Not Found';
        return metadata;
      }
    }
    const user = await findUserById(params.id);
    if (user) {
      metadata.title = user.name;
      metadata.subtitle = new Date(user.createdAt).toDateString()
      metadata.description = `View document published by ${user.name} on Math Editor`;
      metadata.user = { name: user.name, image: user.image!, email: user.email };
    } else {
      metadata.title = 'Error 404';
      metadata.subtitle = 'User Not Found';
    }
  } catch (error) {
    metadata.title = 'Error 500';
    metadata.subtitle = 'Internal Server Error';
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

export default async function Page({ params }: { params: { id: string } }) {
  const isValidId = validate(params.id);
  if (!isValidId) {
    try {
      const id = await findUserIdByHandle(params.id);
      if (id) params.id = id;
    } catch (error) {
      notFound();
    }
  }
  const user = await findUserById(params.id);
  if (!user) notFound();
  const documentsResponse = await findPublishedDocumentsByAuthorId(user.id);
  const documents = documentsResponse.map(document => ({ ...document, variant: "cloud" }));

  return <User user={JSON.parse(JSON.stringify(user))} documents={JSON.parse(JSON.stringify(documents))} />
}