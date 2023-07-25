import type { SerializedEditorState } from "lexical";
import { createHeadlessEditor } from "@lexical/headless";
import { editorConfig } from "../config";
import { $generateHtmlFromNodes } from "./html";

const editor = createHeadlessEditor(editorConfig);

export const generateHtml = (data: SerializedEditorState) => new Promise<string>((resolve, reject) => {
  try {
    const editorState = editor.parseEditorState(data);
    editor.setEditorState(editorState);
    editorState.read(() => {
      let html = $generateHtmlFromNodes(editor);
      const stickyRegex = /<p\b[^>]*>(?:(?!<\/p>).)*<div\b[^>]*class="sticky-note-wrapper"[^>]*>(?:(?!<\/div>).)*<\/div>(?:(?!<\/p>).)*<\/p>/gs;
      const figureRegex = /<p\b[^>]*>(?:(?!<\/p>).)*<figure\b[^>]*>(?:(?!<\/figure>).)*<\/figure>(?:(?!<\/p>).)*<\/p>/gs;
      const stickies = html.match(stickyRegex) || [];
      const figures = html.match(figureRegex) || [];
      const matches = [...stickies, ...figures];
      matches.forEach((match) => html = html.replace(match, match.replace(/^<p/, '<div').replace(/<\/p>$/, '</div>')));
      resolve(html);
    });
  } catch (error) {
    reject(error);
  }
});
