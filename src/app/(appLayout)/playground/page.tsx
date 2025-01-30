import type { Metadata } from "next";
import Playground from "@/components/Playground";
import htmr from "htmr";
import { findUserDocument } from "@/repositories/document";
import SplashScreen from "@/components/SplashScreen";
import { findRevisionHtml } from "@/app/api/utils";

export const metadata: Metadata = {
  title: "Playground",
  description: 'Test drive the editor',
}

const page = async () => {
  const document = await findUserDocument("playground");
  if (!document) return <SplashScreen title="Something went wrong" subtitle="Please try again later" />;
  const revisionId = document.head;
  const html = await findRevisionHtml(revisionId);
  if (html === null) return <SplashScreen title="Something went wrong" subtitle="Please try again later" />;
  return <Playground>{htmr(html)}</Playground>
}

export default page;