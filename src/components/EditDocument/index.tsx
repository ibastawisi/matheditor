"use client"
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import SplashScreen from '../SplashScreen';

const EditDocument: React.FC = () => {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => { setIsClient(true) }, [])
  const fallback = <SplashScreen title="Loading Document" />;
  if (!isClient) return fallback;

  const DocumentEditor = dynamic(() => import('./Editor'), { ssr: false, loading: () => fallback });
  return (
    <DocumentEditor />
  );
}

export default EditDocument;