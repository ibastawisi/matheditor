"use client"
import { MutableRefObject } from 'react';
import { memo } from 'react';
import { EditorDocument } from '@/types';
import type { EditorState, LexicalEditor } from '@/editor/types';
import dynamic from "next/dynamic";
import SplashScreen from './SplashScreen';
import { COMMAND_PRIORITY_LOW, SET_ANNOUNCEMENT_COMMAND, mergeRegister } from '@/editor';
import { actions, useDispatch } from '@/store';

const Editor = dynamic(() => import("@/editor/Editor"), { ssr: false, loading: () => <SplashScreen title="Loading Editor" /> });

const Container: React.FC<{
  document: EditorDocument,
  editorRef?: MutableRefObject<LexicalEditor | null>,
  onChange?: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void;
}> = ({ document, editorRef, onChange }) => {
  const dispatch = useDispatch();
  const editorRefCallback = (editor: LexicalEditor) => {
    if (editorRef) editorRef.current = editor;
    mergeRegister(
      editor.registerCommand(
        SET_ANNOUNCEMENT_COMMAND,
        (payload) => {
          dispatch((actions.announce(payload)))
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
    );
  };

  return (
    <Editor initialConfig={{ editorState: JSON.stringify(document.data) }} onChange={onChange} editorRef={editorRefCallback} />
  );
}

export default memo(Container, (prev, next) => prev.document.id === next.document.id);