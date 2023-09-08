import Home from "@/components/Home";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Math Editor',
  description: 'Math Editor is a free online text editor, with support for LaTeX, Geogebra, Excalidraw and markdown shortcuts. Create, share and print math documents with ease.',
}

const page = () => <Home />;

export default page;