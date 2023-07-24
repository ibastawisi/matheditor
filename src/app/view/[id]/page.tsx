import { findDocumentById } from "@/app/repositories/document";
import ViewDocument from "@/components/ViewDocument";
import { EditorDocument } from "@/types";

export default async function Page({ params }: { params: { id: string } }) {
  const document = await findDocumentById(params.id) as unknown as EditorDocument;
  if (!document) return <ViewDocument params={params} />;
  return <ViewDocument params={params} cloudDocument={document} />;
}