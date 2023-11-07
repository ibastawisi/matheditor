"use client";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { usePathname } from 'next/navigation';
import { lazy } from 'react';

const AppLayout = lazy(() => import('@/components/AppLayout'));
const EmbedLayout = lazy(() => import('@/components/EmbedLayout'));

const LayoutProvider = ({ children }: { children: React.ReactNode; }) => {
  const pathname = usePathname();
  return pathname.startsWith("/embed") ? <EmbedLayout>{children}</EmbedLayout> : <AppLayout>{children}</AppLayout>
};

export default LayoutProvider;