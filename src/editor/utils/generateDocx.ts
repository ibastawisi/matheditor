import type { SerializedEditorState } from "lexical";
import { createHeadlessEditor } from "@lexical/headless";
import { editorConfig } from "../config";
import { $generateDocxBlob } from "./docx";
import { parseHTML } from "linkedom";

export const editor = createHeadlessEditor(editorConfig);

export const generateDocx = (data: SerializedEditorState) => new Promise<Blob>((resolve, reject) => {
  try {
    const dom = parseHTML("<!DOCTYPE html><html><head></head><body></body></html>");
    global = dom;
    global.document = dom.document;
    global.DocumentFragment = dom.DocumentFragment;
    global.Element = dom.Element;
    const editorState = editor.parseEditorState(data);
    editor.setEditorState(editorState);
    const blob = editorState.read($generateDocxBlob);
    resolve(blob);
  } catch (error) {
    reject(error);
  }
});
