"use client"
import { useEffect, useState } from "react";
import { EditorSkeleton } from "../EditorSkeleton";
import { EditorHandoff } from "../EditorHandoff";
import SplashScreen from "../SplashScreen";
import dynamic from "next/dynamic";

const TutorialEditor = dynamic(() => import('./Editor'), { ssr: false });

const Tutorial: React.FC<{ html?: string }> = ({ html }) => {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => { setIsClient(true) }, [])
  const fallback = html ? <EditorSkeleton html={html} /> : <SplashScreen title="Loading Document" />;

  return (
    <EditorHandoff fallback={fallback}>
      {isClient && <TutorialEditor />}
    </EditorHandoff>
  );
}

export default Tutorial;
