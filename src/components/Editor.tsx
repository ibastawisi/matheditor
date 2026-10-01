"use client"
import { RefObject, useEffect } from 'react';
import { COMMAND_PRIORITY_LOW } from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { EditorDocument } from '@/types';
import { ANNOUNCE_COMMAND, UPDATE_DOCUMENT_COMMAND, ALERT_COMMAND } from '@/editor/commands';
import type { EditorState, LexicalEditor } from 'lexical';
import { EditorComposer } from '@/editor/EditorComposer';
import Editor from '@/editor/Editor';
import { alert } from '@/shared/alert';
import { enqueueSnackbar } from 'notistack';
import { Button } from '@mui/material';

type EditorRefCallback = (editor: LexicalEditor) => void | (() => void);
type OnChange = (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void;

const EditorListeners: React.FC<{
  editorRef?: RefObject<LexicalEditor | null> | EditorRefCallback,
  onChange?: OnChange;
}> = ({ editorRef, onChange }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (typeof editorRef === 'function') return editorRef(editor) || undefined;
    if (editorRef) editorRef.current = editor;
  }, [editor, editorRef]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        ANNOUNCE_COMMAND,
        (payload) => {
          enqueueSnackbar(payload.message.title, {
            variant: payload.type,
            description: payload.message.subtitle,
            action: payload.action && <Button color="secondary" size="small" onClick={payload.action.onClick}>{payload.action.label}</Button>,
            autoHideDuration: payload.timeout,
          });
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        ALERT_COMMAND,
        (payload) => {
          alert(payload);
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
  }, [editor, onChange]);

  return null;
}

const Container: React.FC<{
  document: EditorDocument,
  editorRef?: RefObject<LexicalEditor | null> | EditorRefCallback,
  onChange?: OnChange;
  ignoreHistoryMerge?: boolean;
}> = ({ document, editorRef, onChange, ignoreHistoryMerge }) => {
  return (
    <EditorComposer initialState={JSON.stringify(document.data)}>
      <EditorListeners editorRef={editorRef} onChange={onChange} />
      <Editor onChange={onChange} ignoreHistoryMerge={ignoreHistoryMerge} />
    </EditorComposer>
  );
}

export default Container;
