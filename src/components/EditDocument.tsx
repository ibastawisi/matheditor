"use client"
import { useEffect, useState, useRef } from "react";
import Editor from "./Editor";
import SplashScreen from "./SplashScreen";
import { Helmet } from "react-helmet";
import { EditorDocument } from '@/types';
import { useDispatch, actions } from '@/store';
import { usePathname } from "next/navigation";
import { LexicalEditor } from "@/editor";
import DocumentRevisions from "./DocumentRevisions";

const EditDocument: React.FC = () => {
  const [document, setDocument] = useState<EditorDocument>();
  const [error, setError] = useState<string>();
  const dispatch = useDispatch();
  const pathname = usePathname();
  const id = pathname.split('/')[2]?.toLowerCase();
  const editorRef = useRef<LexicalEditor>(null);

  useEffect(() => {
    const loadDocument = async (id: string) => {
      const localResponse = await dispatch(actions.getLocalDocument(id));
      if (localResponse.type === actions.getLocalDocument.fulfilled.type) {
        const localDocument = localResponse.payload as EditorDocument;
        setDocument(localDocument);
      } else {
        const cloudResponse = await dispatch(actions.getCloudDocument(id));
        if (cloudResponse.type === actions.getCloudDocument.fulfilled.type) {
          const cloudDocument = cloudResponse.payload as ReturnType<typeof actions.getCloudDocument.fulfilled>['payload'];
          const { author, published, baseId, revisions, head, ...localDocument } = cloudDocument;
          setDocument(localDocument);
          dispatch(actions.createLocalDocument(localDocument));
        } else if (cloudResponse.type === actions.getCloudDocument.rejected.type) {
          setError(cloudResponse.payload as string);
        }
      }
    }
    id ? loadDocument(id) : setError("No document id provided");
  }, []);

  if (error) return <SplashScreen title={error} />;
  if (!document) return <SplashScreen title="Loading Document" />;

  return <>
    <Helmet title={`${document.name} | Math Editor`} />
    <Editor document={document} editorRef={editorRef} />
    <DocumentRevisions document={document} editorRef={editorRef} />
  </>;
}

export default EditDocument;