"use client";
import StoreProvider from "@/store/StoreProvider";
import TopAppBar from './TopAppBar';
import AlertDialog from "./Alert";
import Announcer from "./Announcer";
import PwaUpdater from "./PwaUpdater";
import Footer from "./Footer";
import ProgressBar from "./ProgressBar";
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