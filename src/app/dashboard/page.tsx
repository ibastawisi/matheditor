import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findAllUsers } from "@/app/repositories/user";
import { findAllDocuments } from "@/app/repositories/document";

export const metadata: Metadata = {
  title: 'Dashboard | Math Editor',
  description: 'Manage your account and documents on Math Editor'
}

const page = async () => {
  const session = await getServerSession(authOptions);
  if (!session) return <Dashboard initialUser={null} />
  const { user } = session;
  const { role } = user;
  if (role !== "admin") return <Dashboard initialUser={JSON.parse(JSON.stringify(user))} />
  const users = await findAllUsers();
  const documents = await findAllDocuments();
  const admin = { users, documents };
  return <Dashboard initialUser={user} admin={JSON.parse(JSON.stringify(admin))} />
}

export default page;