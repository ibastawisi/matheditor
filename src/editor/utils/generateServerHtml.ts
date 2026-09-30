import type { SerializedEditorState } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { createHeadlessEditor } from "./createHeadlessEditor";
import { withServerDOM } from "./withServerDOM";

let editor: ReturnType<typeof createHeadlessEditor> | null = null;

export const generateServerHtml = (data: SerializedEditorState) => new Promise<string>((resolve, reject) => {
  try {
    editor ??= createHeadlessEditor();
    const editorState = editor.parseEditorState(data);
    editor.setEditorState(editorState);
    const html = withServerDOM(() => editor!.read(() => $generateHtmlFromNodes(editor!)));
    resolve(html);
  } catch (error) {
    reject(error);
  }
});
