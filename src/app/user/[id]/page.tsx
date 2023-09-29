import { OgMetadata } from "@/app/api/og/route";
import { findUserById, findUserIdByHandle } from "@/repositories/user";
import type { Metadata } from "next";
import { findPublishedDocumentsByAuthorId } from "@/repositories/document";
import { notFound } from "next/navigation";
import User from "@/components/User";
import { validate } from "uuid";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const metadata: OgMetadata = { id: params.id, title: 'Math Editor' };
  try {
    const isValidId = validate(params.id);
    if (!isValidId) {
      try {
        const id = await findUserIdByHandle(params.id);
        if (id) params.id = id;
        else {
          metadata.subtitle = 'User Not Found';
          return metadata;
        }
      } catch (error) {
        metadata.subtitle = 'User Not Found';
        return metadata;
      }
    }
    const user = await findUserById(params.id);
    if (user) {
      metadata.title = `${user.name} | Math Editor`;
      metadata.subtitle = new Date(user.createdAt).toDateString()
      metadata.description = `${user.name} | Math Editor`;
      metadata.user = { name: user.name, image: user.image!, email: user.email };
    } else {
      metadata.subtitle = 'User Not Found';
    }
  } catch (error) {
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
      else notFound();
    } catch (error) {
      notFound();
    }
  }
  const user = await findUserById(params.id);
  if (!user) notFound();
  const session = await getServerSession(authOptions);
  const documentsResponse = await findPublishedDocumentsByAuthorId(user.id);
  const documents = documentsResponse.map(document => ({ id: document.id, cloud: document }));

  return <User user={user} sessionUser={session?.user} documents={documents} />
}