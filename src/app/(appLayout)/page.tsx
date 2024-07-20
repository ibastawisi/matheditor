import Home from "@/components/Home";
import { findPublishedDocuments } from "@/repositories/document";
import { UserDocument } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Math Editor',
  description: 'Math Editor is a free text editor, with support for LaTeX, Geogebra, Excalidraw and markdown shortcuts. Create, share and print math documents with ease.',
}

const page = async () => {
  const publishedDocuments = await findPublishedDocuments();
  const staticDocuments: UserDocument[] = publishedDocuments.map(document => ({
    id: document.id,
    cloud: document,
  }));
  return <Home staticDocuments={staticDocuments} />
}

export default page;