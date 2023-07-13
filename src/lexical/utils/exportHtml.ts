import type { SerializedEditorState } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { EditorDocument } from "../../store/types";
import { $isStickyNode } from "../nodes/StickyNode";
import { createHeadlessEditor } from "@lexical/headless";
import { editorConfig } from "../config";
import theme from '../theme.css?inline';
import stickyStyles from '../nodes/StickyNode/StickyNode.css?inline';

const editor = createHeadlessEditor(editorConfig);

const generateHtml = (data: SerializedEditorState) => new Promise<string>((resolve, reject) => {
  const editorState = editor.parseEditorState(data);
  editor.setEditorState(editorState);
  editorState.read(() => {
    let html = $generateHtmlFromNodes(editor);
    const fragment = document.createElement('div');
    fragment.innerHTML = html;
    const stickyElements = fragment.querySelectorAll('sticky');
    if (!stickyElements.length) return resolve(html);
    convertStickyElements(stickyElements, editorState).then(() => resolve(fragment.innerHTML));
  });
});

const convertStickyElements = (elements: NodeListOf<Element>, editorState: any) => {
  return Promise.all(Array.from(elements).map((element) => {
    const key = element.getAttribute('key')!;
    const node = editorState._nodeMap.get(key);
    if (!$isStickyNode(node)) return Promise.resolve();
    const data = node.getData();
    const color = node.__color;
    if (!data) return Promise.resolve();
    return generateHtml(data).then((html) => {
      const wrapper = document.createElement('div');
      wrapper.className = "sticky-note-wrapper";
      wrapper.innerHTML = `<div class="sticky-note-container" theme="light"><div class="sticky-note ${color}"><div class="StickyNode__contentEditable">${html}</div></div></div>`;
      element.replaceWith(wrapper);
      const parentElement = wrapper.parentElement!;
      // if the parent element is a paragraph, we need to replace it with a div
      if (parentElement.tagName === "P") {
        const div = document.createElement('div');
        Array.from(parentElement.attributes).forEach((attr) => div.setAttribute(attr.name, attr.value))
        div.append(...parentElement.children);
        parentElement.replaceWith(div);
      }
    })
  }))
}

export const exportHtml = async (document: EditorDocument) => {
  const body = await generateHtml(document.data);
  const head = `
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta name="title" content="${document.name}" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
      <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
      <style>
        :root{color-scheme:light;}
        html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;box-sizing:border-box;-webkit-text-size-adjust:100%;}
        *,*::before,*::after{box-sizing:inherit;}
        body{font-family:"Roboto","Helvetica","Arial",sans-serif;font-weight:400;font-size:1rem;line-height:1.5;letter-spacing:0.00938em;max-width:1200px;margin:2rem auto;padding:0 1.5rem;white-space:pre-wrap;word-break:break-word;}
        img,svg{max-width:100%;background-color:white;}
        .ML__mathlive{padding:4px;}
        @font-face{font-family:Virgil;src:url(https://unpkg.com/@excalidraw/excalidraw/dist/excalidraw-assets/Virgil.woff2);}
        @font-face{font-family:Cascadia;src:url(https://unpkg.com/@excalidraw/excalidraw/dist/excalidraw-assets/Cascadia.woff2);}
        ${theme}
        ${stickyStyles}
      </style>
    </head>
    `;
  return `<html>${head}<body>${body}</body></html>`;
};