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
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next"

const AppLayout = ({ children }: { children: React.ReactNode; }) => {
  const isVercel = !!process.env.NEXT_PUBLIC_VERCEL_URL;
  return (
    <>
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
      {isVercel && <>
        <SpeedInsights />
        <Analytics />
      </>}
    </>
  );
};

export default AppLayout;