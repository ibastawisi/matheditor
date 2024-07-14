"use client";
import StoreProvider from "@/store/StoreProvider";
import TopAppBar from './TopAppBar';
import AlertDialog from "./Alert";
import Announcer from "./Announcer";
import PwaUpdater from "./PwaUpdater";
import ProgressBar from "./ProgressBar";
import Footer from "./Footer";
import { Container } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { Suspense } from "react";
import { Helmet } from "react-helmet";

const AppLayout = ({ children }: { children: React.ReactNode; }) => {
  const { mode } = useColorScheme();
  return (
    <>
      <Helmet meta={[
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: mode === 'dark' ? '#272727' : '#1976d2' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: mode === 'light' ? '#1976d2' : '#272727' },
        { name: 'color-scheme', content: mode === 'system' ? 'light dark' : mode },
      ]} />
      <Suspense><ProgressBar /></Suspense>
      <StoreProvider>
        <TopAppBar />
        <Container className='editor-container'>{children}</Container>
        <Footer />
        <AlertDialog />
        <Announcer />
        <PwaUpdater />
      </StoreProvider>
    </>
  );
};

export default AppLayout;