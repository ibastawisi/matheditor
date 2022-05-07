import { createTheme, ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { createContext, useState, useMemo, useEffect } from "react";

export const ColorModeContext = createContext({ toggleColorMode: () => { } });

export default function ToggleColorMode({ children }: { children: React.ReactNode }) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>(prefersDarkMode ? 'dark' : 'light');
  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => prevMode === 'light' ? 'dark' : 'light');
    },
  }), []);

  useEffect(() => {
    document.body.setAttribute('theme', mode);
    const colorScheme = document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement;
    colorScheme.content = mode;
  }, [mode]);

  const theme = useMemo(() => createTheme({ palette: { mode, }, }), [mode],);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}