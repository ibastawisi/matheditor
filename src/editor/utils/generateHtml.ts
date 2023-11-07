import type { SerializedEditorState } from "lexical";
import { createHeadlessEditor } from "@lexical/headless";
import { editorConfig } from "../config";
import { $generateHtmlFromNodes } from "./html";
import { Window as HapppyWindow } from "happy-dom";
import { convertLatexToMarkup } from "mathlive";

const editor = createHeadlessEditor(editorConfig);

export const generateHtml = (data: SerializedEditorState) => new Promise<string>((resolve, reject) => {
  if (typeof window === "undefined") {
    const { window, document, DocumentFragment, Element, navigator } = new HapppyWindow();
    Object.assign(global, { window, document, DocumentFragment, Element, navigator });
  }
  try {
    const editorState = editor.parseEditorState(data);
    editor.setEditorState(editorState);
    editorState.read(() => {
      let html = $generateHtmlFromNodes(editor);
      const stickyRegex = /<p\b[^>]*>(?:(?!<\/p>).)*<div\b[^>]*class="sticky-note-wrapper"[^>]*>(?:(?!<\/div>).)*<\/div>(?:(?!<\/p>).)*<\/p>/gs;
      const figureRegex = /<p\b[^>]*>(?:(?!<\/p>).)*<figure\b[^>]*>(?:(?!<\/figure>).)*<\/figure>(?:(?!<\/p>).)*<\/p>/gs;
      const stickies = html.match(stickyRegex) || [];
      const figures = html.match(figureRegex) || [];
      [...stickies, ...figures].forEach((match) => html = html.replace(match, match.replace(/^<p/, '<div').replace(/<\/p>$/, '</div>')));
      const mathRegex = /<math-field>(?:(?!<\/math-field>).)*<\/math-field>/g;
      html = html.replaceAll(mathRegex, match => convertLatexToMarkup(match.slice(12, -13)));
      resolve(html);
    });
  } catch (error) {
    reject(error);
  }
});
