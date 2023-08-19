import { OgMetadata } from "@/app/api/og/route";
import { findDocumentById, findDocumentIdByHandle, findUserDocument } from "@/repositories/document";
import ViewDocument from "@/components/ViewDocument";
import { generateHtml } from "@/editor/utils/generateHtml";
import { EditorDocument } from "@/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { JSDOM } from "jsdom";
import parse from 'html-react-parser';
import { validate } from "uuid";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const metadata: OgMetadata = { id: params.id };
  const isValidId = validate(params.id);
  if (!isValidId) {
    try {
      const id = await findDocumentIdByHandle(params.id);
      if (id) params.id = id;
    } catch (error) {
      metadata.title = 'Error 404';
      metadata.subtitle = 'Document Not Found';
      return metadata;
    }
  }
  try {
    const document = await findUserDocument(params.id);
    if (document) {
      metadata.title = document.name;
      metadata.subtitle = new Date(document.createdAt).toDateString()
      metadata.description = `View ${document.name} on Math Editor`;
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
    title: `${title}`,
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
      const id = await findDocumentIdByHandle(params.id);
      if (id) params.id = id;
    } catch (error) {
      notFound();
    }
  }
  const document = await findDocumentById(params.id) as unknown as EditorDocument;
  if (!document) notFound();
  const dom = new JSDOM()
  global.window = dom.window as unknown as Window & typeof globalThis
  global.document = dom.window.document
  global.DocumentFragment = dom.window.DocumentFragment
  global.Element = dom.window.Element
  global.navigator = dom.window.navigator

  const html = await generateHtml(document.data);
  const children = parse(html);

  return <ViewDocument params={{ handle: document.handle || document.id }}>{children}</ViewDocument>;
}