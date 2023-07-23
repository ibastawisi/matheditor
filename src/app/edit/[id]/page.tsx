import EditDocument from "@/components/EditDocument";

export default function Page({ params }: { params: { id: string } }) {
  return <EditDocument params={params} />;
}