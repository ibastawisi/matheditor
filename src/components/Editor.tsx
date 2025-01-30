"use client"
import { RefObject, PropsWithChildren, RefCallback } from 'react';
import { COMMAND_PRIORITY_LOW } from 'lexical';
import { mergeRegister } from '@lexical/utils';
import type { EditorDocument } from '@/types';
import { ANNOUNCE_COMMAND, UPDATE_DOCUMENT_COMMAND, ALERT_COMMAND } from '@/editor/commands';
import { actions, useDispatch } from '@/store';
import type { EditorState, LexicalEditor } from 'lexical';
import Editor from '@/editor/Editor';

const Container: React.FC<{
  document: EditorDocument,
  editorRef?: RefObject<LexicalEditor | null> | RefCallback<LexicalEditor>,
  onChange?: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void;
  ignoreHistoryMerge?: boolean;
}> = ({ document, editorRef, onChange, ignoreHistoryMerge }) => {
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

  return (
    <Editor initialConfig={{ editorState: JSON.stringify(document.data) }} onChange={onChange} editorRef={editorRefCallback} ignoreHistoryMerge={ignoreHistoryMerge} />
  );
}

export default Container;