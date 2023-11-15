"use client";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import ThemeProvider from './ThemeProvider';
import { Analytics } from '@vercel/analytics/react';
import { lazy } from 'react';

const AppLayout = lazy(() => import('./AppLayout'));
const EmbedLayout = lazy(() => import('./EmbedLayout'));

const LayoutProvider = ({ children }: { children: React.ReactNode; }) => {
  const pathname = usePathname();
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = !!process.env.VERCEL_URL;
  const isEmbed = pathname.startsWith("/embed");

  return <html lang="en">
    {isProduction &&
      // eslint-disable-next-line @next/next/no-head-element
      <head>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.MEASUREMENT_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.MEASUREMENT_ID}');
          `}
        </Script>
        {!isEmbed &&
          <Script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${process.env.PUBLISHER_ID}`} strategy="afterInteractive" />
        }
      </head>
    }
    <body>
      <ThemeProvider>
        {isEmbed ?
          <EmbedLayout>{children}</EmbedLayout> :
          <AppLayout>{children}</AppLayout>
        }
      </ThemeProvider>
      {isVercel && <Analytics />}
    </body>
  </html>
};

export default LayoutProvider;