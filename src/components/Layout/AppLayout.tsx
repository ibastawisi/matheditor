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
import { GoogleAnalytics } from '@next/third-parties/google';
import { SpeedInsights } from "@vercel/speed-insights/next"

const IS_VERCEL = !!process.env.NEXT_PUBLIC_VERCEL_URL;
const MEASUREMENT_ID = process.env.MEASUREMENT_ID;

const AppLayout = ({ children }: { children: React.ReactNode; }) => {
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
      {IS_VERCEL && <SpeedInsights />}
      {MEASUREMENT_ID && <GoogleAnalytics gaId={MEASUREMENT_ID} />}
    </>
  );
};

export default AppLayout;