"use client";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { usePathname } from 'next/navigation';
import { lazy, useEffect, useState } from 'react';
import SplashScreen from './SplashScreen';

const AppLayout = lazy(() => import('@/components/AppLayout'));
const EmbedLayout = lazy(() => import('@/components/EmbedLayout'));

const LayoutProvider = ({ children }: { children: React.ReactNode; }) => {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); });
  return <>
    {!isMounted && <SplashScreen />}
    {pathname.startsWith("/embed") ? <EmbedLayout>{children}</EmbedLayout> : <AppLayout>{children}</AppLayout>}
  </>;
};

export default LayoutProvider;