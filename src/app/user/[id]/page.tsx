import { findUserById } from "@/app/repositories/user";
import User from "@/components/User";

export default async function Page({ params }: { params: { id: string } }) {
  const user = await findUserById(params.id);
  return <User user={JSON.parse(JSON.stringify(user))} />;
}