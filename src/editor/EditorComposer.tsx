"use client"
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { configExtension, defineExtension, type InitialEditorStateType } from "lexical";
import { HistoryExtension } from "@lexical/history";
import { useMemo } from "react";
import { FullEditorExtensions } from "./extensions";
import { ImageResizerExtension } from "./extensions/image/resizer";
import { TableCellResizerExtension } from "./extensions/table/resizer";
import { FloatingToolbarExtension } from "./extensions/floating-toolbar";
import { ComponentPickerExtension } from "./extensions/component-picker";
import { PageSlotEditorsExtension } from "./extensions/pages/slot-editors";

/** React decorators rendered alongside the editor */
const EditorUIExtensions = defineExtension({
  name: "@matheditor/ui",
  dependencies: [
    FullEditorExtensions,
    ImageResizerExtension,
    TableCellResizerExtension,
    FloatingToolbarExtension,
    ComponentPickerExtension,
    PageSlotEditorsExtension,
  ],
});

export const EditorComposer: React.FC<
  React.PropsWithChildren<{
    initialState?: InitialEditorStateType;
    editable?: boolean;
    /**
     * The document is edited live: it starts empty and gets its content from
     * the session, whose history replaces the editor's own
     */
    collab?: boolean;
    editorRef?: React.ComponentProps<typeof EditorRefPlugin>["editorRef"];
  }>
> = ({ initialState, editable = true, collab = false, editorRef, children }) => {
  // the initial state is only read when the editor is created
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const extension = useMemo(
    () =>
      defineExtension({
        name: "@matheditor/root",
        $initialEditorState: collab ? null : initialState,
        editable,
        dependencies: collab ? [EditorUIExtensions, configExtension(HistoryExtension, { disabled: true })] : [EditorUIExtensions],
      }),
    [editable, collab]
  );

  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      {children}
      {editorRef && <EditorRefPlugin editorRef={editorRef} />}
    </LexicalExtensionComposer>
  );
};

export default EditorComposer;
