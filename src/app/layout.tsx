import './globals.css'
import type { Metadata, Viewport } from 'next';
import ThemeProvider from '@/components/ThemeProvider';
import LayoutProvider from "@/components/LayoutProvider";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/react';

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
      {process.env.NODE_ENV === 'production' &&
        <head>
          {process.env.MEASUREMENT_ID &&
            <>
              <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.MEASUREMENT_ID}`} strategy="afterInteractive" />
              <Script id="google-analytics" strategy="afterInteractive">
                {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.MEASUREMENT_ID}');
              `}
              </Script>
            </>
          }
          {process.env.PUBLISHER_ID &&
            <Script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${process.env.PUBLISHER_ID}`} strategy="afterInteractive" />
          }
        </head>
      }
      <body>
        <ThemeProvider>
          <LayoutProvider>
            {children}
          </LayoutProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
