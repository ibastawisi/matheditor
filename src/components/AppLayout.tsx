"use client";
import StoreProvider from "@/store/StoreProvider";
import Container from '@mui/material/Container';
import TopAppBar from '@/components/TopAppBar';
import AlertDialog from "@/components/Alert";
import Announcer from "@/components/Announcer";
import PwaUpdater from "@/components/PwaUpdater";
import Footer from "@/components/Footer";
import ProgressBar from "@/components/ProgressBar";

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