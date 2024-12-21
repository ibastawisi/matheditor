import type { SerializedEditorState } from "lexical";
import { createHeadlessEditor } from "@lexical/headless";
import { editorConfig } from "../config";
import { $generateDocxFromNodes } from "./docx";

const editor = createHeadlessEditor(editorConfig);

export const generateDocx = (data: SerializedEditorState) => new Promise<Blob>((resolve, reject) => {
  try {
    const editorState = editor.parseEditorState(data);
    editor.setEditorState(editorState);
    editorState.read(() => {
      const blob = $generateDocxFromNodes(editor);
      resolve(blob);
    });
  } catch (error) {
    reject(error);
  }
});
