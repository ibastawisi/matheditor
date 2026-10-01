"use client"
import { useEffect, useState, useRef, useCallback } from "react";
import SplashScreen from "../SplashScreen";
import { EditorDocument } from '@/types';
import { useAppStore } from '@/store';
import { usePathname } from "next/navigation";
import type { EditorState, LexicalEditor } from "lexical";
import { v4 as uuidv4 } from 'uuid';
import dynamic from "next/dynamic";
import DiffView from "../Diff";
import { debounce } from "@mui/material";
import Editor from "../Editor";

const EditDocumentInfo = dynamic(() => import('@/components/EditDocument/EditDocumentInfo'), { ssr: false });

const DocumentEditor: React.FC = () => {
  const [document, setDocument] = useState<EditorDocument>();
  const [error, setError] = useState<{ title: string, subtitle?: string }>();
  const updateLocalDocument = useAppStore(state => state.updateLocalDocument);
  const getLocalDocument = useAppStore(state => state.getLocalDocument);
  const getCloudDocument = useAppStore(state => state.getCloudDocument);
  const createLocalDocument = useAppStore(state => state.createLocalDocument);
  const createLocalRevision = useAppStore(state => state.createLocalRevision);
  const setDiff = useAppStore(state => state.setDiff);
  const pathname = usePathname();
  const id = pathname.split('/')[2]?.toLowerCase();
  const editorRef = useRef<LexicalEditor>(null);
  const showDiff = useAppStore(state => state.diff.open);

  const debouncedUpdateLocalDocument = useCallback(debounce((id: string, partial: Partial<EditorDocument>) => {
    updateLocalDocument({ id, partial });
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
      const { data: localDocument } = await getLocalDocument(id);
      if (localDocument) return setDocument(localDocument);
      const { data: cloudResponse, error } = await getCloudDocument(id);
      if (!cloudResponse) return setError(error);
      const { cloudDocument, ...editorDocument } = cloudResponse;
      setDocument(editorDocument);
      createLocalDocument(editorDocument);
      const editorDocumentRevision = { id: editorDocument.head, documentId: editorDocument.id, createdAt: editorDocument.updatedAt, data: editorDocument.data };
      createLocalRevision(editorDocumentRevision);
    }
    id ? loadDocument(id) : setError({ title: "Document Not Found" });
    return () => {
      setDiff({ open: false });
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