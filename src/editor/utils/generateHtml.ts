import type { SerializedEditorState } from "lexical";
import { createHeadlessEditor } from "@lexical/headless";
import { editorConfig } from "../config";
import { $generateHtmlFromNodes } from '@lexical/html';

const editor = createHeadlessEditor(editorConfig);

export const generateHtml = (data: SerializedEditorState) => new Promise<string>((resolve, reject) => {
  const editorState = editor.parseEditorState(data);
  editor.setEditorState(editorState);
  editorState.read(() => {
    let html = $generateHtmlFromNodes(editor);
    const regex = /<p\b[^>]*>(?:(?!<\/p>).)*<div\b[^>]*class="sticky-note-wrapper"[^>]*>(?:(?!<\/div>).)*<\/div>(?:(?!<\/p>).)*<\/p>/g;
    const matches = html.match(regex);
    if (!matches) return resolve(html);
    matches.forEach((match) => html = html.replace(match, match.replace(/^<p/, '<div').replace(/<\/p>$/, '</div>')));
    resolve(html);
  });
});
