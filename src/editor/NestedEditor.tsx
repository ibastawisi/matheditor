"use client"
import type { EditorState, Klass, LexicalEditor, LexicalNode } from "lexical";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { EditorPlugins } from "./plugins";
import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer";

export const NestedEditor: React.FC<{
  initialEditor: LexicalEditor;
  initialNodes?: ReadonlyArray<Klass<LexicalNode>>;
  onChange: (editorState: EditorState) => void;
  placeholder?: JSX.Element | ((isEditable: boolean) => JSX.Element | null) | null;
}> = ({ initialEditor, initialNodes, onChange, placeholder }) => <LexicalNestedComposer initialEditor={initialEditor} initialNodes={initialNodes}>
  <EditorPlugins contentEditable={<ContentEditable className="nested-contentEditable" />} placeholder={placeholder} onChange={onChange} />
</LexicalNestedComposer>;

export default NestedEditor;