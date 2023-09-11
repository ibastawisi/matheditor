import './globals.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import type { Metadata } from 'next';
import LayoutProvider from "@/components/LayoutProvider";
import ThemeProvider from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Math Editor',
  description: 'Math Editor is a free text editor, with support for LaTeX, Geogebra, Excalidraw and markdown shortcuts. Create, share and print math documents with ease.',
  colorScheme: 'dark light',
  themeColor: [{
    media: "(prefers-color-scheme: light)",
    color: "#1976d2"
  },
  {
    media: "(prefers-color-scheme: dark)",
    color: "#121212"
  }],
  applicationName: "Math Editor",
  appleWebApp: {
    capable: true,
    title: "Math Editor",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  viewport:
    "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
  manifest: "/manifest.json",
  icons: [
    { rel: "shortcut icon", url: "/favicon.ico" },
  ],
  keywords: ["Math Editor", "Online Math Editor", "Matheditor", "Math", "Editor", "Latex", "Geogebra", "Excalidraw", "Markdown"]
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <LayoutProvider>
            {children}
          </LayoutProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
