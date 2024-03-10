"use client"
import type { EditorState, LexicalEditor } from "lexical";
import { LexicalComposer, InitialConfigType } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import TreeViewPlugin from "./plugins/TreeViewPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { editorConfig } from "./config";
import { EditorPlugins } from "./plugins";
import { MutableRefObject, RefCallback } from "react";
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import "mathlive";
import "mathlive/fonts.css";
import "./styles.css";

export const Editor: React.FC<{
  initialConfig: Partial<InitialConfigType>;
  editorRef: MutableRefObject<LexicalEditor | null> | RefCallback<LexicalEditor>
  onChange?: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void;
}> = ({ initialConfig, onChange, editorRef }) => {
  return (
    <LexicalComposer initialConfig={{ ...editorConfig, ...initialConfig }}>
      <>
        <ToolbarPlugin />
        <EditorPlugins contentEditable={<ContentEditable className="editor-input" />} onChange={onChange} />
        <EditorRefPlugin editorRef={editorRef} />
        {process.env.NODE_ENV === "development" && <TreeViewPlugin />}
      </>
    </LexicalComposer>
  );
};

export default Editor;