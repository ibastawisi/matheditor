import { SerializedEditorState, createEditor } from "lexical";
import { TRANSFORMERS } from '../plugins/MarkdownPlugin/MarkdownTransformers';
import { $convertToMarkdownString } from '@lexical/markdown';
import { editorConfig } from '..';
import { $generateHtmlFromNodes } from "@lexical/html";

export const generateMarkdown = (data: SerializedEditorState) => new Promise<string>((resolve, reject) => {
  const editor = createEditor(editorConfig);
  const editorState = editor.parseEditorState(data);
  editor.setEditorState(editorState);
  editorState.read(() => {
    const markdown = $convertToMarkdownString(TRANSFORMERS);
    resolve(markdown);
  })
});

export const generateHtml = (data: SerializedEditorState) => new Promise<string>((resolve, reject) => {
  const editor = createEditor(editorConfig);
  const editorState = editor.parseEditorState(data);
  editor.setEditorState(editorState);
  editorState.read(() => {
    const html = $generateHtmlFromNodes(editor);
    resolve(html);
  })
});

