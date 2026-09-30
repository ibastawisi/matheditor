"use client"
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { defineExtension, type InitialEditorStateType } from "lexical";
import { useMemo } from "react";
import { FullEditorExtensions } from "./extensions";
import { ImageResizerExtension } from "./extensions/image/resizer";
import { TableCellResizerExtension } from "./extensions/table/resizer";
import { FloatingToolbarExtension } from "./extensions/floating-toolbar";
import { ComponentPickerExtension } from "./extensions/component-picker";

/** React decorators rendered alongside the editor */
const EditorUIExtensions = defineExtension({
  name: "@matheditor/ui",
  dependencies: [
    FullEditorExtensions,
    ImageResizerExtension,
    TableCellResizerExtension,
    FloatingToolbarExtension,
    ComponentPickerExtension,
  ],
});

export const EditorComposer: React.FC<
  React.PropsWithChildren<{
    initialState?: InitialEditorStateType;
    editable?: boolean;
    editorRef?: React.ComponentProps<typeof EditorRefPlugin>["editorRef"];
  }>
> = ({ initialState, editable = true, editorRef, children }) => {
  // the initial state is only read when the editor is created
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const extension = useMemo(
    () =>
      defineExtension({
        name: "@matheditor/root",
        $initialEditorState: initialState,
        editable,
        dependencies: [EditorUIExtensions],
      }),
    [editable]
  );

  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      {children}
      {editorRef && <EditorRefPlugin editorRef={editorRef} />}
    </LexicalExtensionComposer>
  );
};

export default EditorComposer;
