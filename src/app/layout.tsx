import type { Metadata, Viewport } from 'next';
import ThemeProvider from '@/components/Layout/ThemeProvider';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './globals.css'

export const metadata: Metadata = {
  title: 'Math Editor',
  description: 'Math Editor is a free text editor, with support for LaTeX, Geogebra, Excalidraw and markdown shortcuts. Create, share and print math documents with ease.',
  applicationName: "Math Editor",
  appleWebApp: {
    capable: true,
    title: "Math Editor",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: "/favicon.ico",
  keywords: ["Math Editor", "Online Math Editor", "Matheditor", "Math", "Editor", "Latex", "Geogebra", "Excalidraw", "Markdown"],
  metadataBase: new URL(process.env.VERCEL_URL ? 'https://matheditor.me' : `http://localhost:${process.env.PORT || 3000}`),
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark light',
  themeColor: [{
    media: "(prefers-color-scheme: light)",
    color: "#1976d2"
  },
  {
    media: "(prefers-color-scheme: dark)",
    color: "#121212"
  }],

}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
