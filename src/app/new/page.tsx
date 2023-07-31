import NewDocument from "@/components/NewDocument";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Document",
  description: 'Create a new document',
}

const page = () => <NewDocument />;

export default page;