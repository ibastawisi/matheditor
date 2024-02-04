"use client";
import StoreProvider from "@/store/StoreProvider";
import TopAppBar from './TopAppBar';
import AlertDialog from "./Alert";
import Announcer from "./Announcer";
import PwaUpdater from "./PwaUpdater";
import Footer from "./Footer";
import ProgressBar from "./ProgressBar";
import { Container } from "@mui/material";
import { Suspense } from "react";

const AppLayout = ({ children }: { children: React.ReactNode; }) => {
  return (
    <StoreProvider>
      <TopAppBar />
      <Suspense>
        <ProgressBar />
      </Suspense>
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