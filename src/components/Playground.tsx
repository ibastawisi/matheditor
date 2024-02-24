"use client"
import Editor from "@/components/Editor";
import playgroundTemplate from '@/templates/Playground.json';
import type { EditorDocument } from '@/types';
import DisplayAd from "./Ads/DisplayAd";

const document = playgroundTemplate as unknown as EditorDocument;
const Playground: React.FC = () => <>
  <Editor document={document} />
  <DisplayAd sx={{ mt: 2 }} />
</>

export default Playground;