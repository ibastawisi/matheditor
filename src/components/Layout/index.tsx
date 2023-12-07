"use client";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { usePathname } from 'next/navigation';
import ThemeProvider from './ThemeProvider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { lazy } from 'react';

const AppLayout = lazy(() => import('./AppLayout'));
const EmbedLayout = lazy(() => import('./EmbedLayout'));

const LayoutProvider = ({ children }: { children: React.ReactNode; }) => {
  const pathname = usePathname();
  const isEmbed = pathname.startsWith("/embed");
  const isVercel = !!process.env.NEXT_PUBLIC_VERCEL_URL;

  return <html lang="en">
    <body>
      <ThemeProvider>
        {isEmbed ?
          <EmbedLayout>{children}</EmbedLayout> :
          <AppLayout>{children}</AppLayout>
        }
      </ThemeProvider>
      {isVercel && <>
        <SpeedInsights />
        <Analytics />
      </>}
    </body>
  </html>
};

export default LayoutProvider;