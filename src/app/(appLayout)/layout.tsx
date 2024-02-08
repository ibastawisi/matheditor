import AppLayout from "@/components/Layout/AppLayout";

export const metadata = {
  metadataBase: new URL(process.env.PUBLIC_URL!),
  openGraph: {
    title: "Math Editor",
    description: "Math Editor is a free text editor, with support for LaTeX, Geogebra, Excalidraw and markdown shortcuts. Create, share and print math documents with ease.",
    images: [
      {
        url: "/feature.png",
        width: 1024,
        height: 500,
        alt: "Math Editor Feature Image",
      },
    ],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}