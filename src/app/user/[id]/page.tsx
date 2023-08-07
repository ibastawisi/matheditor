import { OgMetadata } from "@/app/api/og/route";
import { findUserById } from "@/repositories/user";
import type { Metadata } from "next";
import { findPublishedDocumentsByAuthorId } from "@/repositories/document";
import { notFound } from "next/navigation";
import User from "@/components/User";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const metadata: OgMetadata = { id: params.id };
  try {
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
  const user = await findUserById(params.id);
  if (!user) notFound();
  const documentsResponse = await findPublishedDocumentsByAuthorId(params.id);
  const documents = documentsResponse.map(document => ({ ...document, variant: "cloud" }));

  return <User user={JSON.parse(JSON.stringify(user))} documents={JSON.parse(JSON.stringify(documents))} />
}