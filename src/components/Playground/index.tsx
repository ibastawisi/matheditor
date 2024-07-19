"use client"
import dynamic from 'next/dynamic';
import { EditorSkeleton } from '../EditorSkeleton';
import { EditorDocument } from '@/types';

const Playground: React.FC<React.PropsWithChildren<{ document: EditorDocument }>> = ({ document, children }) => {
  const Editor = dynamic(() => import("@/components/Editor"), { ssr: false, loading: () => <EditorSkeleton>{children}</EditorSkeleton> });
  return <Editor document={document} />;
}

export default Playground;