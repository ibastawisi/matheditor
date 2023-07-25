"use client"
import React from 'react';
import { memo } from 'react';
import { validate } from 'uuid';
import Box from '@mui/material/Box';
import isEqual from 'fast-deep-equal'
import { EditorDocument } from '@/types';
import type { EditorState } from '@/editor/types';
import dynamic from "next/dynamic";
import SplashScreen from './SplashScreen';
import useIndexedDBStore from '@/hooks/useIndexedDB';

const Editor = dynamic(() => import("@/editor/Editor"), { ssr: false, loading: () => <SplashScreen title="Loading Editor" /> });

const Container: React.FC<{ document: EditorDocument, onChange?: (editorState: EditorState) => void }> = ({ document, onChange }) => {

  const documentDB = useIndexedDBStore<EditorDocument>('documents');
  
  function handleChange(editorState: EditorState) {
    const data = editorState.toJSON();
    if (isEqual(data, document.data)) return;
    try {
      const updatedDocument: EditorDocument = { ...document, data, updatedAt: new Date().toISOString() };
      validate(document.id) && documentDB.update(updatedDocument);
      onChange && onChange(editorState);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Box className="editor">
      <Editor initialConfig={{ editorState: JSON.stringify(document.data) }} onChange={handleChange} />
    </Box>
  );
}


export default memo(Container, (prev, next) => prev.document.id === next.document.id);