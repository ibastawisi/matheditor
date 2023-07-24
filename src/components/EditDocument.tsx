"use client"
import { useEffect, useState } from "react";
import Editor from "./Editor";

import SplashScreen from "./SplashScreen";
import { Helmet } from "react-helmet";
import documentDB from "@/indexeddb";
import { EditorDocument } from '@/types';

const EditDocument: React.FC<{ params: { id?: string }, cloudDocument?: EditorDocument }> = ({ params, cloudDocument }) => {
  const [document, setDocument] = useState<EditorDocument | null>(null);

  useEffect(() => {
    const loadDocument = async (id: string) => {
      const storedDocument = await documentDB.getByID(id);
      if (storedDocument) {
        setDocument(storedDocument);
      } else if (cloudDocument) {
        setDocument(cloudDocument);
        documentDB.add(cloudDocument).catch((e) => console.error(e));
      }
    }
    params.id && loadDocument(params.id);

  }, []);

  if (!document) return <SplashScreen title="Loading Document" />;

  return document?.id === params.id ? <>
    <Helmet><title>{document.name}</title></Helmet>
    <Editor document={document} editable={true} />
  </> : <SplashScreen title="Loading Document" />;
}

export default EditDocument;