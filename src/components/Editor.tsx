"use client"
import { lazy, MutableRefObject, PropsWithChildren, RefCallback, Suspense, useEffect, useState } from 'react';
import { EditorDocument } from '@/types';
import type { EditorState, LexicalEditor } from '@/editor';
import { COMMAND_PRIORITY_LOW, ANNOUNCE_COMMAND, UPDATE_DOCUMENT_COMMAND, ALERT_COMMAND, mergeRegister } from '@/editor';
import { actions, useDispatch } from '@/store';
import { EditorSkeleton } from './EditorSkeleton';
import SplashScreen from './SplashScreen';

const Editor = lazy(() => import('@/editor/Editor'));

const Container: React.FC<PropsWithChildren<{
  document: EditorDocument,
  editorRef?: MutableRefObject<LexicalEditor | null> | RefCallback<LexicalEditor>,
  onChange?: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void;
  ignoreHistoryMerge?: boolean;
}>> = ({ document, editorRef, onChange, ignoreHistoryMerge, children }) => {
  const dispatch = useDispatch();
  const editorRefCallback = (editor: LexicalEditor) => {
    if (typeof editorRef === 'function') {
      editorRef(editor);
    } else if (typeof editorRef === 'object') {
      editorRef.current = editor;
    }
    return mergeRegister(
      editor.registerCommand(
        ANNOUNCE_COMMAND,
        (payload) => {
          dispatch((actions.announce(payload)))
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        ALERT_COMMAND,
        (payload) => {
          dispatch(actions.alert(payload));
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        UPDATE_DOCUMENT_COMMAND,
        () => {
          const editorState = editor.getEditorState();
          onChange?.(editorState, editor, new Set());
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
    );
  };

  const isServer = typeof window === 'undefined';
  const fallback = children ? <EditorSkeleton>{children}</EditorSkeleton> : <SplashScreen title="Loading Document" />;

  return (
    <Suspense fallback={fallback}>
      {isServer ? fallback : <Editor initialConfig={{ editorState: JSON.stringify(document.data) }} onChange={onChange} editorRef={editorRefCallback} ignoreHistoryMerge={ignoreHistoryMerge} />}
    </Suspense>
  );
}

export default Container;