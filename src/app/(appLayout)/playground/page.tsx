import type { Metadata } from "next";
import Playground from "@/components/Playground";

export const metadata: Metadata = {
  title: "Playground",
  description: 'Test drive the editor',
}

const page = () => <Playground />;

export default page;