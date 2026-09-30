import { buildEditorFromExtensions } from "@lexical/extension";
import { HeadlessExtension } from "@lexical/headless";
import { type AnyLexicalExtension, defineExtension, InitialEditorStateType } from "lexical";
import { CoreEditorExtensions } from "@/editor/extensions";

/** Creates an editor without a DOM, used to read and export documents */
export function createHeadlessEditor(initialState?: InitialEditorStateType, extensions: AnyLexicalExtension[] = []) {
  return buildEditorFromExtensions(
    defineExtension({
      name: "@matheditor/headless",
      $initialEditorState: initialState,
      editable: false,
      dependencies: [CoreEditorExtensions, HeadlessExtension, ...extensions],
    })
  );
}
