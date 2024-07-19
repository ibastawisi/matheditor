import type { SerializedEditorState } from "lexical";
import { createHeadlessEditor } from "@lexical/headless";
import { editorConfig } from "../config";
import { $generateHtmlFromNodes } from "@lexical/html";
import { parseHTML } from "linkedom";

const editor = createHeadlessEditor(editorConfig);

export const generateServerHtml = (data: SerializedEditorState) => new Promise<string>((resolve, reject) => {
  try {
    const dom = parseHTML("<!DOCTYPE html><html><head></head><body></body></html>");
    global = dom;
    global.document = dom.document;
    global.DocumentFragment = dom.DocumentFragment;
    global.Element = dom.Element;
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
