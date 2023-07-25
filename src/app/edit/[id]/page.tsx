import EditDocument from "@/components/EditDocument";

export default async function Page({ params }: { params: { id: string } }) {
  return <EditDocument params={params} />;
}