import type { SerializedEditorState } from "lexical";
import { createHeadlessEditor } from "@lexical/headless";
import { editorConfig } from "../config";
import { $getDocxFileChildren, generateDocxBlob } from "./docx";

const editor = createHeadlessEditor(editorConfig);

export const generateDocx = (data: SerializedEditorState) => new Promise<Blob>((resolve, reject) => {
  try {
    // const children = toDocxSection(data as LexicalJson)
    // toDocx([{ children }], numbering).then(resolve)
    const editorState = editor.parseEditorState(data);
    editor.setEditorState(editorState);
    const children = editorState.read($getDocxFileChildren);
    const blob = generateDocxBlob(children);
    resolve(blob);
  } catch (error) {
    reject(error);
  }
});
