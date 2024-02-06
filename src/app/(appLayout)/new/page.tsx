import NewDocument from "@/components/NewDocument";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Document | Math Editor",
  description: 'Create a new document',
}

export const dynamic = "force-static";

const page = () => <NewDocument />;

export default page;