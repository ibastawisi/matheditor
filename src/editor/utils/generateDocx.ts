import type { SerializedEditorState } from "lexical";
import { createHeadlessEditor } from "@lexical/headless";
import { editorConfig } from "../config";
import { $generateDocxBlobFromEditor } from "./docx";

const editor = createHeadlessEditor(editorConfig);

export const generateDocx = (data: SerializedEditorState) => new Promise<Blob>((resolve, reject) => {
  try {
    const editorState = editor.parseEditorState(data);
    editor.setEditorState(editorState);
    const blob = editorState.read($generateDocxBlobFromEditor);
    resolve(blob);
  } catch (error) {
    reject(error);
  }
});
