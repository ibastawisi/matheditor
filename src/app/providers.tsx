"use client";

import StoreProvider from "@/store/StoreProvider";
import ThemeRegistry from "@/theme/ThemeRegistry";
import { SessionProvider } from "next-auth/react";
import { usePathname } from 'next/navigation';
import Container from '@mui/material/Container';
import TopAppBar from '@/components/TopAppBar';
import AlertDialog from "@/components/Alert";
import Announcer from "@/components/Announcer";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <ThemeRegistry options={{ key: 'mui', prepend: true }}>
    <SessionProvider>
      <StoreProvider>
        {children}
      </StoreProvider>
    </SessionProvider>
  </ThemeRegistry>;
};

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  if (pathname.startsWith("/embed")) {
    return <Providers>{children}</Providers>
  }
  else {
    return (
      <Providers>
        <TopAppBar />
        <Container className='editor-container'>
          {children}
        </Container>
        <AlertDialog />
        <Announcer />
      </Providers>
    )
  }
};

