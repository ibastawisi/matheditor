"use client"
import playgroundTemplate from './playground.json';
import { PropsWithChildren } from 'react';
import { EditorDocument } from '@/types';
import Editor from "../Editor";

const document = playgroundTemplate as unknown as EditorDocument;

const PlaygroundEditor: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <Editor document={document} />
  );
}

export default PlaygroundEditor;