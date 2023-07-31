import Home from "@/components/Home";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Math Editor',
  description: 'Write math reports as Easy as Pi',
}

const page = () => <Home />;

export default page;