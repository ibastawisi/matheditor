import type { Metadata, Viewport } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import ThemeProvider from '@/components/Layout/ThemeProvider';
import RobotoLatin400 from '@fontsource/roboto/files/roboto-latin-400-normal.woff2?url';
import RobotoLatin500 from '@fontsource/roboto/files/roboto-latin-500-normal.woff2?url';
import RobotoLatin700 from '@fontsource/roboto/files/roboto-latin-700-normal.woff2?url';
import 'mathlive/static.css';
import '@/editor/theme.css';
import './globals.css';

const PUBLIC_URL = process.env.PUBLIC_URL;

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
  metadataBase: PUBLIC_URL ? new URL(PUBLIC_URL) : undefined,
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
  interactiveWidget: 'resizes-content',
  colorScheme: 'dark light',
  themeColor: [{
    media: '(prefers-color-scheme: light)',
    color: '#ffffff',
  }, {
    media: '(prefers-color-scheme: dark)',
    color: '#121212',
  }],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" as="font" type="font/woff2" href={RobotoLatin400} crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/woff2" href={RobotoLatin500} crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/woff2" href={RobotoLatin700} crossOrigin="anonymous" />
      </head>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
