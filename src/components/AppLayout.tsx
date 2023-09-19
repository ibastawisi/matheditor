"use client";
import StoreProvider from "@/store/StoreProvider";
import TopAppBar from '@/components/TopAppBar';
import AlertDialog from "@/components/Alert";
import Announcer from "@/components/Announcer";
import PwaUpdater from "@/components/PwaUpdater";
import Footer from "@/components/Footer";
import ProgressBar from "@/components/ProgressBar";
import { Container } from "@mui/material";

const AppLayout = ({ children }: { children: React.ReactNode; }) => {
  return (
    <StoreProvider>
      <TopAppBar />
      <ProgressBar />
      <Container className='editor-container'>
        {children}
      </Container>
      <Footer />
      <AlertDialog />
      <Announcer />
      <PwaUpdater />
    </StoreProvider>
  );
};

export default AppLayout;