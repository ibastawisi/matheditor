import type { Metadata } from "next";
import Playground from "@/components/Playground";
import htmr from "htmr";
import { findUserDocument } from "@/repositories/document";
import { findRevisionHtml } from "@/app/api/utils";

export const metadata: Metadata = {
  title: "Playground",
  description: 'Test drive the editor',
}

const page = async () => {
  const document = await findUserDocument("playground");
  if (!document) return <Playground />;
  const revisionId = document.head;
  const html = await findRevisionHtml(revisionId);
  if (html === null) return <Playground />;
  return <Playground>{htmr(html)}</Playground>
}

export default page;