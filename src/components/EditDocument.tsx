"use client"
import { useEffect, useState } from "react";
import Editor from "./Editor";

import SplashScreen from "./SplashScreen";
import { Helmet } from "react-helmet";
import { EditorDocument } from '@/types';
import useIndexedDBStore from "@/hooks/useIndexedDB";

const EditDocument: React.FC<{ params: { id?: string }, cloudDocument?: EditorDocument }> = ({ params, cloudDocument }) => {
  const [document, setDocument] = useState(cloudDocument);
  const documentDB = useIndexedDBStore<EditorDocument>('documents');

  useEffect(() => {
    const loadDocument = async (id: string) => {
      const localDocument = await documentDB.getByID(id);
      if (localDocument) {
        setDocument(localDocument);
      } else if (cloudDocument) {
        setDocument(cloudDocument);
        documentDB.add(cloudDocument).catch((e) => console.error(e));
      }
    }
    params.id && loadDocument(params.id);

  }, []);

  if (!document) return <SplashScreen title="Loading Document" />;

  return document?.id === params.id ? <>
    <Helmet title={`${document.name} | Math Editor`} />
    <Editor document={document} editable={true} />
  </> : <SplashScreen title="Loading Document" />;
}

export default EditDocument;