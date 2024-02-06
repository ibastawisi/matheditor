import EditDocument from "@/components/EditDocument";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Document | Math Editor",
  description: 'Edit a document on Math Editor',
}

export const dynamic = "force-static";

const page = () => <EditDocument />;

export default page;