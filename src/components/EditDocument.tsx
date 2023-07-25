"use client"
import { useEffect, useState } from "react";
import Editor from "./Editor";

import SplashScreen from "./SplashScreen";
import { Helmet } from "react-helmet";
import { EditorDocument } from '@/types';
import useIndexedDBStore from "@/hooks/useIndexedDB";
import { AppDispatch, actions } from "@/store";
import { useDispatch } from "react-redux";

const EditDocument: React.FC<{ params: { id?: string }, cloudDocument?: EditorDocument }> = ({ params, cloudDocument }) => {
  const [document, setDocument] = useState<EditorDocument>();
  const documentDB = useIndexedDBStore<EditorDocument>('documents');
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const loadDocument = async (id: string) => {
      const localDocument = await documentDB.getByID(id);
      if (localDocument) {
        setDocument(localDocument);
        dispatch(actions.loadDocument(localDocument));
      } else if (cloudDocument) {
        setDocument(cloudDocument);
        dispatch(actions.loadDocument(cloudDocument));
      }
    }
    params.id && loadDocument(params.id);

  }, []);

  if (!document) return <SplashScreen title="Loading Document" />;

  return document?.id === params.id ? <>
    <Helmet title={`${document.name} | Math Editor`} />
    <Editor document={document} />
  </> : <SplashScreen title="Loading Document" />;
}

export default EditDocument;