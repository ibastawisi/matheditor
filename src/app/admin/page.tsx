import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import SplashScreen from "@/components/SplashScreen";
import { findAllUsers } from "@/repositories/user";
import { findAllDocuments } from "@/repositories/document";
import AdminDashboard from "@/components/AdminDashboard";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | Math Editor",
  description: "Admin Dashboard",
}

export const dynamic = "force-dynamic";

export default async function Page() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return <SplashScreen title="Not Authenticated" />;
    }
    const { user } = session;
    if (user.disabled) {
      return <SplashScreen title="Account Disabled" />;
    }
    if (user.role !== "admin") {
      return <SplashScreen title="Not Authorized" />;
    }
    const users = await findAllUsers();
    const documents = await findAllDocuments();
    return <AdminDashboard users={JSON.parse(JSON.stringify(users))} documents={JSON.parse(JSON.stringify(documents))} />;
  } catch (error) {
    console.log(error);
    return <SplashScreen title="Something went wrong" />;
  }

}
