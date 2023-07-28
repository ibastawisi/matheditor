import EditDocument from "@/components/EditDocument";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Document | Math Editor",
  description: 'Edit a document',
}

export default async function Page({ params }: { params: { id: string } }) {
  return <EditDocument params={params} />;
}