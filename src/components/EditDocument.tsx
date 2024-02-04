"use client"
import { useEffect, useState, useRef } from "react";
import Editor from "./Editor";
import SplashScreen from "./SplashScreen";
import { Helmet } from "react-helmet";
import { EditorDocument } from '@/types';
import { useDispatch, actions } from '@/store';
import { usePathname } from "next/navigation";
import { EditorState, LexicalEditor } from "@/editor";
import { v4 as uuidv4 } from 'uuid';
import dynamic from "next/dynamic";

const EditDocumentInfo = dynamic(() => import('@/components/EditDocumentInfo'), { ssr: false });

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
    const updatedDocument: Partial<EditorDocument> = { data, updatedAt: new Date().toISOString(), head: uuidv4() };
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
        if (editorDocument.collab) {
          const cloudResponse = await dispatch(actions.getCloudDocument(id));
          if (cloudResponse.type === actions.getCloudDocument.fulfilled.type) {
            const cloudDocument = cloudResponse.payload as ReturnType<typeof actions.getCloudDocument.fulfilled>['payload'];
            if (cloudDocument.updatedAt > editorDocument.updatedAt) {
              const localRevisionResponse = await dispatch(actions.getLocalRevision(editorDocument.head));
              const isHeadLocalRevision = localRevisionResponse.type === actions.getLocalRevision.fulfilled.type;
              if (!isHeadLocalRevision) {
                const editorDocumentRevision = { id: editorDocument.head, documentId: editorDocument.id, createdAt: editorDocument.updatedAt, data: editorDocument.data };
                await dispatch(actions.createLocalRevision(editorDocumentRevision));
              }
              await dispatch(actions.updateLocalDocument({ id: editorDocument.id, partial: cloudDocument }));
              setDocument(cloudDocument);
            } else setDocument(editorDocument);
          } else setDocument(editorDocument);
        } else setDocument(editorDocument);
      } else {
        const cloudResponse = await dispatch(actions.getCloudDocument(id));
        debugger
        if (cloudResponse.type === actions.getCloudDocument.fulfilled.type) {
          const editorDocument = cloudResponse.payload as ReturnType<typeof actions.getCloudDocument.fulfilled>['payload'];
          setDocument(editorDocument);
          dispatch(actions.createLocalDocument(editorDocument));
          const editorDocumentRevision = { id: editorDocument.head, documentId: editorDocument.id, createdAt: editorDocument.updatedAt, data: editorDocument.data };
          dispatch(actions.createLocalRevision(editorDocumentRevision));
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
    <EditDocumentInfo documentId={document.id} editorRef={editorRef} />
  </>;
}

export default EditDocument;