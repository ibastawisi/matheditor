"use client"
import { useEffect, useState } from "react";
import Editor from "./Editor";

import SplashScreen from "./SplashScreen";
import { Helmet } from "react-helmet";
import { EditorDocument } from '@/types';
import useIndexedDBStore from "@/hooks/useIndexedDB";
import { AppDispatch, actions } from "@/store";
import { useDispatch } from "react-redux";
import { usePathname } from "next/navigation";

const EditDocument: React.FC = () => {
  const pathname = usePathname();
  const params = { id: pathname.split("/")[2] };
  const [document, setDocument] = useState<EditorDocument>();
  const documentDB = useIndexedDBStore<EditorDocument>('documents');
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const loadDocument = async (id: string) => {
      const localResponse = await dispatch(actions.getLocalDocument(id));
      if (localResponse.type === actions.getLocalDocument.fulfilled.type) {
        const localDocument = localResponse.payload as EditorDocument;
        setDocument(localDocument);
      } else {
        const cloudResponse = await dispatch(actions.getCloudDocument(id));
        if (cloudResponse.type === actions.getCloudDocument.fulfilled.type) {
          const cloudDocument = cloudResponse.payload as EditorDocument;
          setDocument(cloudDocument);
          dispatch(actions.createLocalDocument(cloudDocument));
        }
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