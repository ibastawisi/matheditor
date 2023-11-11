import { OgMetadata } from "@/app/api/og/route";
import { findUserDocument } from "@/repositories/document";
import ViewDocument from "@/components/ViewDocument";
import htmr from 'htmr';
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const metadata: OgMetadata = { id: params.id, title: 'Math Editor' };
  try {
    const document = await findUserDocument(params.id);
    if (document) {
      metadata.title = `${document.name} | Math Editor`;
      metadata.subtitle = new Date(document.createdAt).toDateString()
      metadata.description = `${document.name} | Math Editor`;
      metadata.user = { name: document.author.name, image: document.author.image!, email: document.author.email };
    } else {
      metadata.subtitle = 'Document Not Found';
    }
  } catch (error) {
    metadata.subtitle = 'Internal Server Error';
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

export default async function Page({ params }: { params: { id: string } }) {
  const document = await findUserDocument(params.id);
  if (!document) notFound();
  const response = await fetch(`${process.env.PUBLIC_URL}/api/embed/${document.head}`);
  if (!response.ok) throw new Error('Failed to generate HTML');
  const html = await response.text();
  const session = await getServerSession(authOptions);
  return <ViewDocument cloudDocument={document} user={session?.user}>{htmr(html)}</ViewDocument>;
}