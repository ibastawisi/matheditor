import type { SerializedEditorState } from "lexical";
import { TRANSFORMERS } from '../plugins/MarkdownPlugin/MarkdownTransformers';
import { $convertToMarkdownString } from '@lexical/markdown';
import { $isStickyNode } from "../nodes/StickyNode";
import { createHeadlessEditor } from "@lexical/headless";
import { editorConfig } from "../config";

const editor = createHeadlessEditor(editorConfig);

export const generateMarkdown = (data: SerializedEditorState) => new Promise<string>((resolve, reject) => {
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
      });
    })).then(() => resolve(markdown));
  });
});
