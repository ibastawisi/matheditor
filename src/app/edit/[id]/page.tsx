import { findDocumentById } from "@/app/repositories/document";
import EditDocument from "@/components/EditDocument";

export default async function Page({ params }: { params: { id: string } }) {
  const document = await findDocumentById(params.id);
  if (!document) return <EditDocument params={params} />;
  return <EditDocument params={params} cloudDocument={JSON.parse(JSON.stringify(document))} />;
}