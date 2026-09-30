import type { SerializedEditorState } from "lexical";
import { $generateDocxBlob } from "./docx";
import { createHeadlessEditor } from "./createHeadlessEditor";
import { withServerDOM } from "./withServerDOM";

export const generateDocx = async (data: SerializedEditorState) => {
  const editor = createHeadlessEditor();
  const editorState = editor.parseEditorState(data);
  editor.setEditorState(editorState);
  // the document is converted synchronously, only packing it into a blob is async
  const blob = withServerDOM(() => editor.read($generateDocxBlob));
  return blob;
};
