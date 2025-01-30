import type { Metadata } from "next";
import Tutorial from "@/components/Tutorial";
import htmr from "htmr";
import { findRevisionHtml } from "@/app/api/utils";
import SplashScreen from "@/components/SplashScreen";
import { findUserDocument } from "@/repositories/document";

export const metadata: Metadata = {
  title: 'Tutorial',
  description: 'Learn how to use Math Editor',
}

const page = async () => {
  const document = await findUserDocument("tutorial");
  if (!document) return <SplashScreen title="Something went wrong" subtitle="Please try again later" />;
  const revisionId = document.head;
  const html = await findRevisionHtml(revisionId);
  if (html === null) return <SplashScreen title="Something went wrong" subtitle="Please try again later" />;
  return <Tutorial>{htmr(html)}</Tutorial>
}

export default page;