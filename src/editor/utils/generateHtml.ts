import type { SerializedEditorState } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { createHeadlessEditor } from "./createHeadlessEditor";
import { addSignedUrls } from "./addSignedUrls";

let editor: ReturnType<typeof createHeadlessEditor> | null = null;

export const generateHtml = async (data: SerializedEditorState): Promise<string> => {
  editor ??= createHeadlessEditor();
  const parsed = editor.parseEditorState(data);
  const editorState = (typeof window !== "undefined" ? await addSignedUrls(parsed) : null) ?? parsed;
  editor.setEditorState(editorState);
  return editor.read(() => $generateHtmlFromNodes(editor!));
};
