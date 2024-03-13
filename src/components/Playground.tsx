"use client"
import Editor from "@/components/Editor";
import playgroundTemplate from '@/templates/Playground.json';
import type { EditorDocument } from '@/types';

const document = playgroundTemplate as unknown as EditorDocument;
const Playground: React.FC = () => <Editor document={document} />;

export default Playground;