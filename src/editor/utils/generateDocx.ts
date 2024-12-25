import type { SerializedEditorState } from "lexical";
import { createHeadlessEditor } from "@lexical/headless";
import { editorConfig } from "../config";
import { $generateDocxBlob } from "./docx";

const editor = createHeadlessEditor(editorConfig);

export const generateDocx = (data: SerializedEditorState) => new Promise<Blob>((resolve, reject) => {
  try {
    const editorState = editor.parseEditorState(data);
    editor.setEditorState(editorState);
    const blob = editorState.read($generateDocxBlob);
    resolve(blob);
  } catch (error) {
    reject(error);
  }
});
