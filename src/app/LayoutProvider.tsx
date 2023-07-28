"use client";
import { usePathname } from 'next/navigation';
import { lazy } from 'react';

const AppLayout = lazy(() => import('@/app/AppLayout'));
const EmbedLayout = lazy(() => import('@/app/EmbedLayout'));

const LayoutProvider = ({ children }: { children: React.ReactNode; }) => {
  const pathname = usePathname();
  return pathname.startsWith("/embed")? <EmbedLayout>{children}</EmbedLayout>: <AppLayout>{children}</AppLayout>;
};

export default LayoutProvider;