"use client"
import { useEffect, useState } from "react";
import { EditorSkeleton } from "../EditorSkeleton";
import SplashScreen from "../SplashScreen";
import dynamic from "next/dynamic";

const Tutorial: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => { setIsClient(true) }, [])
  const fallback = children ? <EditorSkeleton>{children}</EditorSkeleton> : <SplashScreen title="Loading Document" />;
  if (!isClient) return fallback;

  const TutorialEditor = dynamic(() => import('./Editor'), { ssr: false, loading: () => fallback });
  return (
    <TutorialEditor>{children}</TutorialEditor>
  );
}

export default Tutorial;