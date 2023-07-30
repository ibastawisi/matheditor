import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";

export const metadata: Metadata = {
  title: 'Dashboard | Math Editor',
  description: 'Manage your account and documents on Math Editor'
}

const page = async () => {
  return <Dashboard  />
}

export default page;