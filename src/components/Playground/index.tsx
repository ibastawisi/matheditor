"use client"
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { EditorSkeleton } from '../EditorSkeleton';
import { EditorHandoff } from '../EditorHandoff';
import SplashScreen from '../SplashScreen';

const PlaygroundEditor = dynamic(() => import('./Editor'), { ssr: false });

const Playground: React.FC<{ html?: string }> = ({ html }) => {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => { setIsClient(true) }, [])
  const fallback = html ? <EditorSkeleton html={html} /> : <SplashScreen title="Loading Document" />;

  return (
    <EditorHandoff fallback={fallback}>
      {isClient && <PlaygroundEditor />}
    </EditorHandoff>
  );
}

export default Playground;
