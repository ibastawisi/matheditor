"use client"
import { CssBaseline, useMediaQuery } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { createContext, useState, useMemo, useEffect } from "react";

export const ColorModeContext = createContext({ toggleColorMode: () => { } });

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => prevMode === 'light' ? 'dark' : 'light');
    },
  }), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersLightTheme = window.matchMedia('(prefers-color-scheme: light)').matches;
    const mode = prefersLightTheme ? 'light' : 'dark';
    setMode(mode);
  }, [prefersDarkMode]);

  useEffect(() => {
    document.body.setAttribute('theme', mode);
  }, [mode]);

  const theme = useMemo(() => createTheme({ palette: { mode, }, }), [mode],);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}