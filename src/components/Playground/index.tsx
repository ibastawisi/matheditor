"use client"
import playgroundTemplate from './playground.json';
import type { EditorDocument } from '@/types';
import dynamic from "next/dynamic";
import SplashScreen from '../SplashScreen';

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false, loading: () => <SplashScreen title="Loading Editor" /> });
const document = playgroundTemplate as unknown as EditorDocument;
const Playground: React.FC = () => <Editor document={document} />;

export default Playground;