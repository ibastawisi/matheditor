"use client"
import { RefObject, useEffect } from 'react';
import { COMMAND_PRIORITY_LOW } from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { EditorDocument } from '@/types';
import { ANNOUNCE_COMMAND, UPDATE_DOCUMENT_COMMAND, ALERT_COMMAND } from '@/editor/commands';
import { actions, useDispatch } from '@/store';
import type { EditorState, LexicalEditor } from 'lexical';
import { EditorComposer } from '@/editor/EditorComposer';
import Editor from '@/editor/Editor';

type EditorRefCallback = (editor: LexicalEditor) => void | (() => void);
type OnChange = (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void;

const EditorListeners: React.FC<{
  editorRef?: RefObject<LexicalEditor | null> | EditorRefCallback,
  onChange?: OnChange;
}> = ({ editorRef, onChange }) => {
  const [editor] = useLexicalComposerContext();
  const dispatch = useDispatch();

  useEffect(() => {
    if (typeof editorRef === 'function') return editorRef(editor) || undefined;
    if (editorRef) editorRef.current = editor;
  }, [editor, editorRef]);

  useEffect(() => {
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
  }, [editor, dispatch, onChange]);

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
