import AppLayout from "@/components/Layout/AppLayout";
import { Viewport } from "next/types";

export const viewport: Viewport = {
  themeColor: [{
    media: '(prefers-color-scheme: light)',
    color: '#1976d2',
  }, {
    media: '(prefers-color-scheme: dark)',
    color: '#272727',
  }],
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}