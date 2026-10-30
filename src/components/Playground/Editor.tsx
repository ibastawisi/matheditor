"use client"
import playgroundTemplate from './playground.json';
import { EditorDocument } from '@/types';
import type { Services } from '@/editor/extensions/services/types';
import Editor from "../Editor";

const document = playgroundTemplate as unknown as EditorDocument;
const localServices: Services = {};

const PlaygroundEditor: React.FC = () => {
  return (
    <Editor document={document} services={localServices} />
  );
}

export default PlaygroundEditor;