import EditDocument from "@/components/EditDocument";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Document",
  description: 'Edit a document on Math Editor',
}

const page = () => <EditDocument />;

export default page;