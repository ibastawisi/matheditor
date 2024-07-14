"use client";
import { useColorScheme } from "@mui/material/styles";
import { Helmet } from "react-helmet";

const AppLayout = ({ children }: { children: React.ReactNode; }) => {
  const { mode } = useColorScheme();
  return (
    <>
      <Helmet meta={[
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: mode === 'dark' ? '#121212' : '#ffffff' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: mode === 'light' ? '#ffffff' : '#121212' },
        { name: 'color-scheme', content: mode === 'system' ? 'light dark' : mode },
      ]} />
      {children}
    </>
  );
};

export default AppLayout;