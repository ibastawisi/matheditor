"use client"
import playgroundTemplate from './playground.json';
import type { EditorDocument } from '@/types';
import Editor from '../Editor';

const document = playgroundTemplate as unknown as EditorDocument;

const Playground: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <Editor document={document}>{children}</Editor>
}

export default Playground;