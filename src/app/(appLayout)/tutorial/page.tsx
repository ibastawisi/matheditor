import type { Metadata } from "next";
import Tutorial from "@/components/Tutorial";
import htmr from "htmr";
import tutorialTemplate from '@/components/Tutorial/tutorial.json';
import type { EditorDocument } from '@/types';
import { generateServerHtml } from "@/editor/utils/generateServerHtml";

export const metadata: Metadata = {
  title: 'Tutorial',
  description: 'Learn how to use Math Editor',
}

const document = tutorialTemplate as unknown as EditorDocument;

const page = async () => {
  const html = await generateServerHtml(document.data);
  return <Tutorial>{htmr(html)}</Tutorial>
}

export default page;