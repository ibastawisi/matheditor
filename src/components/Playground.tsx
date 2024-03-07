"use client"
import Editor from "@/components/Editor";
import playgroundTemplate from '@/templates/Playground.json';
import type { EditorDocument } from '@/types';
import dynamic from "next/dynamic";

const DisplayAd = dynamic(() => import('@/components/Ads/DisplayAd'), { ssr: false });

const document = playgroundTemplate as unknown as EditorDocument;
const Playground: React.FC = () => <>
  <Editor document={document} />
  <DisplayAd />
</>

export default Playground;