"use client"
import { CssBaseline, useMediaQuery } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { createContext, useState, useMemo, useEffect } from "react";
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';

export const ColorModeContext = createContext({ toggleColorMode: () => { } });

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: 'css' });
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }
    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{
          __html: `@layer emotion {${styles}}`,
        }}
      />
    );
  });

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
    <CacheProvider value={cache}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </CacheProvider>
  );
}