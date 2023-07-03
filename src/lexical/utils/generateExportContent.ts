import { SerializedEditorState, createEditor } from "lexical";
import { TRANSFORMERS } from '../plugins/MarkdownPlugin/MarkdownTransformers';
import { $convertToMarkdownString } from '@lexical/markdown';
import { editorConfig } from '..';
import { $generateHtmlFromNodes } from "@lexical/html";
import { $isStickyNode } from "../nodes/StickyNode";

export const generateMarkdown = (data: SerializedEditorState) => new Promise<string>((resolve, reject) => {
  const editor = createEditor(editorConfig);
  const editorState = editor.parseEditorState(data);
  editor.setEditorState(editorState);
  editorState.read(() => {
    let markdown = $convertToMarkdownString(TRANSFORMERS);
    const stickyRegex = /<sticky key="(.+?)" \/>/g;
    const stickyMatches = markdown.match(stickyRegex);
    if (!stickyMatches) return resolve(markdown);
    const stickyKeys = stickyMatches.map((match) => match.replace(stickyRegex, '$1'));
    const stickyNodes = stickyKeys.map((key) => editorState._nodeMap.get(key));
    if (!stickyNodes.length) return resolve(markdown);
    Promise.all(stickyNodes.map((node) => {
      if (!$isStickyNode(node)) return Promise.resolve();
      const data = node.getData();
      if (!data) return Promise.resolve();
      return generateMarkdown(data).then((result) => {
        const stickyRegex = new RegExp(`<sticky key="${node.getKey()}" \/>`, 'g');
        markdown = markdown.replace(stickyRegex, result + '\n\n');
      })
    })).then(() => resolve(markdown));
  })
});

export const generateHtml = (data: SerializedEditorState) => new Promise<string>((resolve, reject) => {
  const editor = createEditor(editorConfig);
  const editorState = editor.parseEditorState(data);
  editor.setEditorState(editorState);
  editorState.read(() => {
    let html = $generateHtmlFromNodes(editor);
    const fragment = document.createElement('div');
    fragment.innerHTML = html;
    const stickyElements = fragment.querySelectorAll('sticky');
    if (!stickyElements.length) return resolve(html);
    convertStickyElements(stickyElements, editorState).then(() => resolve(fragment.innerHTML));
  })
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
