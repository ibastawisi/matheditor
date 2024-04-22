"use client"
import { MutableRefObject } from 'react';
import { memo } from 'react';
import { EditorDocument } from '@/types';
import type { EditorState, LexicalEditor } from '@/editor/types';
import { COMMAND_PRIORITY_LOW, SET_ANNOUNCEMENT_COMMAND, UPDATE_DOCUMENT_COMMAND } from '@/editor';
import { actions, useDispatch } from '@/store';
import Editor from '@/editor/Editor';

const Container: React.FC<{
  document: EditorDocument,
  editorRef?: MutableRefObject<LexicalEditor | null>,
  onChange?: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void;
}> = ({ document, editorRef, onChange }) => {
  const dispatch = useDispatch();
  const editorRefCallback = (editor: LexicalEditor) => {
    if (editorRef) editorRef.current = editor;
    editor.registerCommand(
      SET_ANNOUNCEMENT_COMMAND,
      (payload) => {
        dispatch((actions.announce(payload)))
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    editor.registerCommand(
      UPDATE_DOCUMENT_COMMAND,
      () => {
        if (editorRef && editorRef.current) {
          const editorState = editorRef.current.getEditorState();
          onChange?.(editorState, editorRef.current, new Set());
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  };

  return (
    <Editor initialConfig={{ editorState: JSON.stringify(document.data) }} onChange={onChange} editorRef={editorRefCallback} />
  );
}

export default memo(Container, (prev, next) => prev.document.id === next.document.id);