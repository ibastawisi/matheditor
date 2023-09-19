import { OgMetadata } from "@/app/api/og/route";
import { findDocumentById, findDocumentIdByHandle, findUserDocument } from "@/repositories/document";
import { EditorDocument } from "@/types";
import { Metadata } from "next";
import { JSDOM } from "jsdom";
import parse from 'html-react-parser';
import { generateHtml } from "@/editor/utils/generateHtml";
import EmbedDocument from "@/components/EmbedDocument";
import { notFound } from 'next/navigation'
import { validate } from "uuid";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const metadata: OgMetadata = { id: params.id, title: 'Math Editor' };
  const isValidId = validate(params.id);
  if (!isValidId) {
    try {
      const id = await findDocumentIdByHandle(params.id);
      if (id) params.id = id;
      else {
        metadata.subtitle = 'Document Not Found';
        return metadata;
      }
    } catch (error) {
      metadata.subtitle = 'Document Not Found';
      return metadata;
    }
  }
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
      const id = await findDocumentIdByHandle(params.id);
      if (id) params.id = id;
      else notFound();
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

  return <EmbedDocument>{children}</EmbedDocument>
}