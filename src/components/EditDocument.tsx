"use client"
import { useEffect, useState } from "react";
import Editor from "./Editor";
import SplashScreen from "./SplashScreen";
import { Helmet } from "react-helmet";
import { EditorDocument } from '@/types';
import { AppDispatch, actions } from "@/store";
import { useDispatch } from "react-redux";
import { useSearchParams } from "next/navigation";

const EditDocument: React.FC = () => {
  const [document, setDocument] = useState<EditorDocument>();
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

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
    id && loadDocument(id);

  }, [searchParams]);

  if (!document) return <SplashScreen title="Loading Document" />;

  return document?.id === id ? <>
    <Helmet title={`${document.name} | Math Editor`} />
    <Editor document={document} />
  </> : <SplashScreen title="Loading Document" />;
}

export default EditDocument;