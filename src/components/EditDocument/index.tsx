"use client"
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { EditorSkeleton } from '../EditorSkeleton';
import SplashScreen from '../SplashScreen';

const EditDocument: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => { setIsClient(true) }, [])
  const fallback = children ? <EditorSkeleton>{children}</EditorSkeleton> : <SplashScreen title="Loading Document" />;
  if (!isClient) return fallback;

  const DocumentEditor = dynamic(() => import('./Editor'), { ssr: false, loading: () => fallback });
  return (
    <DocumentEditor>{children}</DocumentEditor>
  );
}

export default EditDocument;