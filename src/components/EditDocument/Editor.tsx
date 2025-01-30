"use client"
import { useEffect, useState, useRef, useCallback } from "react";
import SplashScreen from "../SplashScreen";
import { EditorDocument } from '@/types';
import { useDispatch, actions, useSelector } from '@/store';
import { usePathname } from "next/navigation";
import type { EditorState, LexicalEditor } from "lexical";
import { v4 as uuidv4 } from 'uuid';
import dynamic from "next/dynamic";
import DiffView from "../Diff";
import { debounce } from "@mui/material";
import Editor from "../Editor";

const EditDocumentInfo = dynamic(() => import('@/components/EditDocument/EditDocumentInfo'), { ssr: false });

const DocumentEditor: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [document, setDocument] = useState<EditorDocument>();
  const [error, setError] = useState<{ title: string, subtitle?: string }>();
  const dispatch = useDispatch();
  const pathname = usePathname();
  const id = pathname.split('/')[2]?.toLowerCase();
  const editorRef = useRef<LexicalEditor>(null);
  const showDiff = useSelector(state => state.ui.diff.open);

  const debouncedUpdateLocalDocument = useCallback(debounce((id: string, partial: Partial<EditorDocument>) => {
    dispatch(actions.updateLocalDocument({ id, partial }));
  }, 300), [document]);

  function handleChange(editorState: EditorState, editor: LexicalEditor, tags: Set<string>) {
    if (!document) return;
    const data = editorState.toJSON();
    const updatedDocument: Partial<EditorDocument> = { data, updatedAt: new Date().toISOString(), head: uuidv4() };
    try {
      const payload = JSON.parse(tags.values().next().value as string);
      if (payload.id === document.id) { Object.assign(updatedDocument, payload.partial); }
    } catch (e) { }
    debouncedUpdateLocalDocument(document.id, updatedDocument);
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
          const { cloudDocument, ...editorDocument } = cloudResponse.payload as ReturnType<typeof actions.getCloudDocument.fulfilled>['payload'];
          setDocument(editorDocument);
          dispatch(actions.createLocalDocument(editorDocument));
          const editorDocumentRevision = { id: editorDocument.head, documentId: editorDocument.id, createdAt: editorDocument.updatedAt, data: editorDocument.data };
          dispatch(actions.createLocalRevision(editorDocumentRevision));
        } else if (cloudResponse.type === actions.getCloudDocument.rejected.type) {
          setError(cloudResponse.payload as { title: string, subtitle?: string });
        }
      }
    }
    id ? loadDocument(id) : setError({ title: "Document Not Found" });
    return () => {
      dispatch(actions.setDiff({ open: false }));
    }
  }, []);

  if (error) return <SplashScreen title={error.title} subtitle={error.subtitle} />;
  if (!document) return <SplashScreen title="Loading Document" />;

  return <>
    <title>{document.name}</title>
    {showDiff && <DiffView />}
    <Editor document={document} editorRef={editorRef} onChange={handleChange} />
    <EditDocumentInfo documentId={document.id} editorRef={editorRef} />
  </>;
}

export default DocumentEditor;