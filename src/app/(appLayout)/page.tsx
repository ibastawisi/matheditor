import Home from "@/components/Home";
import { findPublishedDocuments } from "@/repositories/document";
import { UserDocument } from "@/types";
import type { Metadata } from "next";
import { findRevisionThumbnail } from "../api/utils";
import { ThumbnailProvider } from "@/app/context/ThumbnailContext";

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
  const staticThumbnails = publishedDocuments.reduce((acc, document) => {
    acc[document.head] = findRevisionThumbnail(document.head);
    return acc;
  }, {} as Record<string, Promise<string | null>>);
  return (
    <ThumbnailProvider thumbnails={staticThumbnails}>
      <Home staticDocuments={staticDocuments} />
    </ThumbnailProvider>
  );
}

export default page;