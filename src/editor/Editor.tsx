"use client"
import type { EditorState, LexicalEditor } from "lexical";
import { LexicalComposer, InitialConfigType } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import TreeViewPlugin from "./plugins/TreeViewPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { editorConfig } from "./config";
import { EditorPlugins } from "./plugins";
import "./styles.css";
import { MutableRefObject } from "react";
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';

export const Editor: React.FC<{ initialConfig: Partial<InitialConfigType>; onChange: (editorState: EditorState) => void; editorRef?: MutableRefObject<LexicalEditor | null> }> 
= ({ initialConfig, onChange, editorRef }) => {
  return (
    <LexicalComposer initialConfig={{ ...editorConfig, ...initialConfig }}>
      <>
        <ToolbarPlugin />
        <EditorPlugins contentEditable={<ContentEditable className="editor-input" />} onChange={onChange} />
        {editorRef && <EditorRefPlugin editorRef={editorRef} />}
        {process.env.NODE_ENV === "development" && <TreeViewPlugin />}
      </>
    </LexicalComposer>
  );
};

export default Editor;