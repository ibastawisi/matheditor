import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your account and documents on Math Editor'
}

const page = () => <Dashboard />;

export default page;