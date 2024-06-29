import type { SerializedEditorState } from "lexical";
import { createHeadlessEditor } from "@lexical/headless";
import { editorConfig } from "../config";
import { $generateHtmlFromNodes } from "@lexical/html";

const editor = createHeadlessEditor(editorConfig);

export const generateHtml = (data: SerializedEditorState) => new Promise<string>((resolve, reject) => {
  try {
    const editorState = editor.parseEditorState(data);
    editor.setEditorState(editorState);
    editorState.read(() => {
      let html = $generateHtmlFromNodes(editor);
      resolve(html);
    });
  } catch (error) {
    reject(error);
  }
});
