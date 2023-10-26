import { OgMetadata } from "@/app/api/og/route";
import { findUserDocument } from "@/repositories/document";
import ViewDocument from "@/components/ViewDocument";
import { generateHtml } from "@/editor/utils/generateHtml";
import htmr from 'htmr';
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { findRevisionById } from "@/repositories/revision";

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
  const revision = await findRevisionById(document.head);
  if (!revision) notFound();
  const html = await generateHtml(revision.data);
  return <ViewDocument cloudDocument={document}>{htmr(html)}</ViewDocument>;
}