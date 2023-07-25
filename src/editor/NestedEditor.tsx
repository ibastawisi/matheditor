"use client"
import type { EditorState, LexicalEditor } from "lexical";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { EditorPlugins } from "./plugins";
import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer";

export const NestedEditor: React.FC<{
  initialEditor: LexicalEditor;
  onChange: (editorState: EditorState) => void;
  placeholder?: JSX.Element | ((isEditable: boolean) => JSX.Element | null) | null;
}> = ({ initialEditor, onChange, placeholder }) => <LexicalNestedComposer initialEditor={initialEditor}>
  <EditorPlugins contentEditable={<ContentEditable className="nested-contentEditable" />} placeholder={placeholder} onChange={onChange} />
</LexicalNestedComposer>;

export default NestedEditor;