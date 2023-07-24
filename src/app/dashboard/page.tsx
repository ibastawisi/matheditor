import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findAllUsers } from "@/app/repositories/user";
import { findAllDocuments } from "@/app/repositories/document";

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your documents'
}

const page = async () => {
  const session = await getServerSession(authOptions);
  if (!session) return <Dashboard />
  const { user } = session;
  const { role } = user;
  if (role !== "admin") return <Dashboard user={JSON.parse(JSON.stringify(user))} />
  const users = await findAllUsers();
  const documents = await findAllDocuments();
  const admin = { users, documents };
  return <Dashboard user={user} admin={JSON.parse(JSON.stringify(admin))} />
}

export default page;