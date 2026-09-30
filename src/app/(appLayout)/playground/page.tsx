import type { Metadata } from "next";
import Playground from "@/components/Playground";
import { findUserDocument } from "@/repositories/document";
import { findRevisionHtml } from "@/app/api/utils";

export const dynamic = 'force-dynamic';

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
  return <Playground html={html} />
}

export default page;