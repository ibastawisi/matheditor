"use client"
import type { Klass, LexicalEditor, LexicalNode, LexicalNodeReplacement } from "lexical";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { EditorPlugins } from "./plugins";
import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer";
import { UPDATE_DOCUMENT_COMMAND } from "./commands";

export const NestedEditor: React.FC<{
  initialEditor: LexicalEditor;
  initialNodes?: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement>
  placeholder?: JSX.Element | ((isEditable: boolean) => JSX.Element | null) | null;
}> = ({ initialEditor, initialNodes, placeholder }) => {
  const parentEditor = initialEditor._parentEditor;
  const onChange = () => {
    if (!parentEditor) return;
    parentEditor.dispatchCommand(UPDATE_DOCUMENT_COMMAND, undefined);
  };
  return (
    <LexicalNestedComposer initialEditor={initialEditor} initialNodes={initialNodes}>
      <EditorPlugins placeholder={placeholder} onChange={onChange}
        contentEditable={
          <ContentEditable className="nested-contentEditable" ariaLabel="editor input" />
        }
      />
    </LexicalNestedComposer>
  );
}

export default NestedEditor;