import type { Metadata } from "next";
import Tutorial from "@/components/Tutorial";
import htmr from "htmr";
import { findRevisionHtml } from "@/app/api/utils";
import { findUserDocument } from "@/repositories/document";

export const metadata: Metadata = {
  title: 'Tutorial',
  description: 'Learn how to use Math Editor',
}

const page = async () => {
  const document = await findUserDocument("tutorial");
  if (!document) return <Tutorial />;
  const revisionId = document.head;
  const html = await findRevisionHtml(revisionId);
  if (html === null) return <Tutorial />;
  return <Tutorial>{htmr(html)}</Tutorial>
}

export default page;