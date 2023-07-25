import { OgMetadata } from "@/app/api/og/route";
import { findDocumentById, findDocumentMetadata } from "@/app/repositories/document";
import NewDocument from "@/components/NewDocument";
import { EditorDocument } from "@/types";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const metadata: OgMetadata = { id: params.id };
  try {
    const document = await findDocumentMetadata(params.id);
    if (document) {
      metadata.title = document.name;
      metadata.subtitle = new Date(document.createdAt).toDateString()
      metadata.description = `New ${document.name} on Math Editor`;
      metadata.user = { name: document.author.name, image: document.author.image!, email: document.author.email };
    } else {
      metadata.title = 'Error 404';
      metadata.subtitle = 'Document Not Found';
    }
  } catch (error) {
    metadata.title = 'Error 500';
    metadata.subtitle = 'Internal Server Error';
  }

  const { title, subtitle, description } = metadata;
  const image = `/api/og?metadata=${encodeURIComponent(JSON.stringify(metadata))}`;

  return {
    title: `${title} | Math Editor`,
    description: description ?? subtitle,
    openGraph: {
      images: [image],
    },
  }
}

export default async function Page({ params }: { params: { id: string } }) {
  const document = await findDocumentById(params.id) as unknown as EditorDocument;
  if (!document) return <NewDocument params={params} />;
  return <NewDocument params={params} cloudDocument={JSON.parse(JSON.stringify(document))} />
}