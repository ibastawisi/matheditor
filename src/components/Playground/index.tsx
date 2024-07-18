"use client"
import playgroundTemplate from './playground.json';
import type { EditorDocument } from '@/types';
import dynamic from 'next/dynamic';
import { EditorSkeleton } from '../EditorSkeleton';

const document = playgroundTemplate as unknown as EditorDocument;
const Playground: React.FC<React.PropsWithChildren> = ({ children }) => {
  const Editor = dynamic(() => import("@/components/Editor"), { ssr: false, loading: () => <EditorSkeleton>{children}</EditorSkeleton> });
  return <Editor document={document} />;
}

export default Playground;