import type { Metadata } from "next";
import Tutorial from "@/components/Tutorial";
import htmr from "htmr";
import { findUserDocument } from "@/repositories/document";

const PUBLIC_URL = process.env.PUBLIC_URL;

export const metadata: Metadata = {
  title: 'Tutorial',
  description: 'Learn how to use Math Editor',
}

const page = async () => {
  const userDocument = await findUserDocument('tutorial');
  if (!userDocument) return <Tutorial />;
  const response = await fetch(`${PUBLIC_URL}/api/embed/${userDocument.head}`);
  if (!response.ok) return <Tutorial />;
  const html = await response.text();
  return <Tutorial>{htmr(html)}</Tutorial>
}

export default page;