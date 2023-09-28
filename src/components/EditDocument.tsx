"use client"
import { useEffect, useState, useRef } from "react";
import Editor from "./Editor";
import SplashScreen from "./SplashScreen";
import { Helmet } from "react-helmet";
import { EditorDocument } from '@/types';
import { useDispatch, actions } from '@/store';
import { usePathname } from "next/navigation";
import { EditorState, LexicalEditor } from "@/editor";
import DocumentRevisions from "./DocumentRevisions";
import isEqual from "fast-deep-equal";

const EditDocument: React.FC = () => {
  const [document, setDocument] = useState<EditorDocument>();
  const [error, setError] = useState<string>();
  const dispatch = useDispatch();
  const pathname = usePathname();
  const id = pathname.split('/')[2]?.toLowerCase();
  const editorRef = useRef<LexicalEditor>(null);

  function handleChange(editorState: EditorState, editor: LexicalEditor, tags: Set<string>) {
    if (!document) return;
    const data = editorState.toJSON();
    if (isEqual(data, document.data)) return dispatch(actions.updateLocalDocument({ id: document.id, partial: document }));
    const updatedDocument: Partial<EditorDocument> = { data, updatedAt: new Date().toISOString(), head: null };
    try {
      const payload = JSON.parse(tags.values().next().value);
      if (payload.id === document.id) { Object.assign(updatedDocument, payload.partial); }
    } catch (e) { }
    dispatch(actions.updateLocalDocument({ id: document.id, partial: updatedDocument }));
  }

  useEffect(() => {
    const loadDocument = async (id: string) => {
      const localResponse = await dispatch(actions.getLocalDocument(id));
      if (localResponse.type === actions.getLocalDocument.fulfilled.type) {
        const editorDocument = localResponse.payload as EditorDocument;
        setDocument(editorDocument);
      } else {
        const cloudResponse = await dispatch(actions.getCloudDocument(id));
        if (cloudResponse.type === actions.getCloudDocument.fulfilled.type) {
          const editorDocument = cloudResponse.payload as ReturnType<typeof actions.getCloudDocument.fulfilled>['payload'];
          setDocument(editorDocument);
          dispatch(actions.createLocalDocument(editorDocument));
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
    <Editor document={document} editorRef={editorRef} onChange={handleChange} />
    <DocumentRevisions documentId={document.id} editorRef={editorRef} />
  </>;
}

export default EditDocument;