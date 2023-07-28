"use client"
import React from 'react';
import { memo } from 'react';
import { validate } from 'uuid';
import isEqual from 'fast-deep-equal'
import { EditorDocument } from '@/types';
import type { EditorState } from '@/editor/types';
import dynamic from "next/dynamic";
import SplashScreen from './SplashScreen';
import { useDispatch } from 'react-redux';
import { AppDispatch, actions } from '@/store';

const Editor = dynamic(() => import("@/editor/Editor"), { ssr: false, loading: () => <SplashScreen title="Loading Editor" /> });

const Container: React.FC<{ document: EditorDocument, onChange?: (editorState: EditorState) => void }> = ({ document, onChange }) => {

  const dispatch = useDispatch<AppDispatch>();

  function handleChange(editorState: EditorState) {
    const data = editorState.toJSON();
    if (isEqual(data, document.data)) return;
    const updatedDocument: EditorDocument = { ...document, data, updatedAt: new Date().toISOString() };
    validate(document.id) && dispatch(actions.saveDocument(updatedDocument));
    onChange && onChange(editorState);
  }
  return (
    <Editor initialConfig={{ editorState: JSON.stringify(document.data) }} onChange={handleChange} />
  );
}


export default memo(Container, (prev, next) => prev.document.id === next.document.id);