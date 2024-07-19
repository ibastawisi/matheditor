import type { Metadata } from "next";
import Playground from "@/components/Playground";
import htmr from "htmr";
import playgroundTemplate from '@/components/Playground/playground.json';
import type { EditorDocument } from '@/types';
import { generateServerHtml } from "@/editor/utils/generateServerHtml";

export const metadata: Metadata = {
  title: "Playground",
  description: 'Test drive the editor',
}

const document = playgroundTemplate as unknown as EditorDocument;

const page = async () => {
  const html = await generateServerHtml(document.data);
  return <Playground>{htmr(html)}</Playground>
}

export default page;