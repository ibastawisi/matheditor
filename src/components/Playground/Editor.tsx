"use client"
import playgroundTemplate from './playground.json';
import { EditorDocument } from '@/types';
import Editor from "../Editor";

const document = playgroundTemplate as unknown as EditorDocument;

const PlaygroundEditor: React.FC = () => {
  return (
    <Editor document={document} />
  );
}

export default PlaygroundEditor;