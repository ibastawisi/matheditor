"use client";
import StoreProvider from "@/store/StoreProvider";
import { SessionProvider } from "next-auth/react";
import Container from '@mui/material/Container';
import TopAppBar from '@/components/TopAppBar';
import AlertDialog from "@/components/Alert";
import Announcer from "@/components/Announcer";
import PwaUpdater from "@/components/PwaUpdater";
import Footer from "@/components/Footer";
import Fallback from "@/components/Fallback";

const AppLayout = ({ children }: { children: React.ReactNode; }) => {
  return (
    <SessionProvider>
      <StoreProvider>
        <TopAppBar />
        <Container className='editor-container'>
          <Fallback>
            {children}
          </Fallback>
        </Container>
        <Footer />
        <AlertDialog />
        <Announcer />
        {process.env.NODE_ENV === "production" && <PwaUpdater />}
      </StoreProvider>
    </SessionProvider>
  );
};

export default AppLayout;