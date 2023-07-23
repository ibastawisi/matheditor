"use client"
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { actions } from "@/store";
import { AppDispatch } from "@/store";
import Editor from "./Editor";

import SplashScreen from "./SplashScreen";
import { Helmet } from "react-helmet";
import documentDB from "@/indexeddb";
import { EditorDocument } from '@/types';

const EditDocument: React.FC<{ params: { id?: string } }> = ({ params }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [document, setDocument] = useState<EditorDocument | null>(null);

  useEffect(() => {
    const loadDocument = async (id: string) => {
      // load from local storage
      const storedDocument = await documentDB.getByID(id);
      if (storedDocument) {
        setDocument(storedDocument);
        dispatch(actions.app.loadDocument(storedDocument));
      } else {
        // load from server
        const response = await dispatch(actions.app.getDocumentAsync(id));
        const { payload, error } = response as any;
        if (!error) {
          setDocument(payload);
          dispatch(actions.app.loadDocument(payload));
        }
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