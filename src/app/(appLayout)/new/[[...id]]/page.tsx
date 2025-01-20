import NewDocument from "@/components/NewDocument";
import type { OgMetadata } from "@/app/api/og/route";
import { findUserDocument } from "@/repositories/document";
import type { Metadata } from "next";

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
  const document = await findUserDocument(params.id[0], searchParams.v);
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

const page = () => <NewDocument />;

export default page;