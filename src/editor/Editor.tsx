"use client"
import type { EditorState, LexicalEditor } from "lexical";
import { LexicalComposer, InitialConfigType } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { editorConfig } from "./config";
import { EditorPlugins } from "./plugins";
import { MutableRefObject, RefCallback } from "react";
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import "mathlive";
import "mathlive/fonts.css";

export const Editor: React.FC<{
  initialConfig: Partial<InitialConfigType>;
  editorRef: MutableRefObject<LexicalEditor | null> | RefCallback<LexicalEditor>
  onChange?: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void;
  ignoreHistoryMerge?: boolean;
}> = ({ initialConfig, onChange, editorRef, ignoreHistoryMerge }) => {
  return (
    <LexicalComposer initialConfig={{ ...editorConfig, ...initialConfig }}>
      <>
        <ToolbarPlugin />
        <EditorPlugins contentEditable={<ContentEditable className="editor-input" />} onChange={onChange} ignoreHistoryMerge={ignoreHistoryMerge} />
        <EditorRefPlugin editorRef={editorRef} />
      </>
    </LexicalComposer>
  );
};

export default Editor;