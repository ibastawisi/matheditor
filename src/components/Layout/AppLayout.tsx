"use client";
import StoreProvider from "@/store/StoreProvider";
import TopAppBar from './TopAppBar';
import AlertDialog from "./Alert";
import Announcer from "./Announcer";
import PwaUpdater from "./PwaUpdater";
import ProgressBar from "./ProgressBar";
import { Container } from "@mui/material";
import { Suspense } from "react";

const AppLayout = ({ children }: { children: React.ReactNode; }) => {
  return (
    <>
      <Suspense>
        <ProgressBar />
      </Suspense>
      <StoreProvider>
        <TopAppBar />
        <Container
          className='editor-container'
          sx={{
            display: 'flex',
            flexDirection: 'column',
            mx: 'auto',
            my: 2,
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
          }}>
          {children}
        </Container>
        <AlertDialog />
        <Announcer />
        <PwaUpdater />
      </StoreProvider>
    </>
  );
};

export default AppLayout;