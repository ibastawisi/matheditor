"use client"
import React, { Suspense } from 'react';
import { memo } from 'react';
import { useDispatch } from "react-redux";
import { validate } from 'uuid';
import Box from '@mui/material/Box';
import isEqual from 'fast-deep-equal'
import useLocalStorage from '../hooks/useLocalStorage';
import { AppDispatch, actions } from '../store';
import { EditorDocument } from '@/types';
import type { EditorState } from '@/editor/types';
import dynamic from "next/dynamic";
import SplashScreen from './SplashScreen';

const Editor = dynamic(() => import("@/editor/Editor"), { ssr: false, loading: () => <SplashScreen title="Loading Editor" /> });

const Container: React.FC<{ document: EditorDocument, editable: boolean, onChange?: (editorState: EditorState) => void }> = ({ document, editable, onChange }) => {
  const [appConfig] = useLocalStorage('config', { debug: false });
  const dispatch = useDispatch<AppDispatch>();

  function handleChange(editorState: EditorState) {
    if (!editable) return;
    const data = editorState.toJSON();
    if (isEqual(data, document.data)) return;
    const updatedDocument: EditorDocument = { ...document, data, updatedAt: new Date().toISOString() };
    validate(document.id) && dispatch(actions.app.saveDocument(updatedDocument));
    onChange && onChange(editorState);
  }

  return (
    <Box className="editor">
      <Editor initialConfig={{ editorState: JSON.stringify(document.data), editable }} appConfig={appConfig} onChange={handleChange} />
    </Box>
  );
}


export default memo(Container, (prev, next) => prev.document.id === next.document.id);