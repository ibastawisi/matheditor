"use client";
import StoreProvider from "@/store/StoreProvider";
import TopAppBar from './TopAppBar';
import AlertDialog from "./Alert";
import Announcer from "./Announcer";
import PwaUpdater from "./PwaUpdater";
import ProgressBar from "./ProgressBar";
import Footer from "./Footer";
import { Container } from "@mui/material";
import { Suspense } from "react";
import dynamic from "next/dynamic";

const DisplayAd = dynamic(() => import('@/components/Ads/DisplayAd'), { ssr: false });

const AppLayout = ({ children }: { children: React.ReactNode; }) => {
  return (
    <StoreProvider>
      <TopAppBar />
      <Suspense><ProgressBar /></Suspense>
      <Container className='editor-container'>{children}</Container>
      <Container sx={{ mb: 2 }}><DisplayAd /></Container>
      <Footer />
      <AlertDialog />
      <Announcer />
      <PwaUpdater />
    </StoreProvider>
  );
};

export default AppLayout;