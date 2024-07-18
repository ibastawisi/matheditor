import type { Metadata } from "next";
import Playground from "@/components/Playground";
import htmr from "htmr";
import { findUserDocument } from "@/repositories/document";

const PUBLIC_URL = process.env.PUBLIC_URL;

export const metadata: Metadata = {
  title: "Playground",
  description: 'Test drive the editor',
}

const page = async () => {
  const userDocument = await findUserDocument('playground');
  if (!userDocument) return <Playground />;
  const response = await fetch(`${PUBLIC_URL}/api/embed/${userDocument.head}`);
  if (!response.ok) return <Playground />;
  const html = await response.text();
  return <Playground>{htmr(html)}</Playground>
}

export default page;