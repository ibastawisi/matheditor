"use client"
import { CssBaseline } from "@mui/material";
import {
  Experimental_CssVarsProvider as CssVarsProvider,
  experimental_extendTheme as extendTheme,
} from '@mui/material/styles';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = extendTheme();

  return (
    <CssVarsProvider theme={theme} attribute="theme" defaultMode="system">
      <script dangerouslySetInnerHTML={{
        __html: `(function(){try {document.documentElement.setAttribute('theme',  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark': 'light');} catch(e){}})();`
      }} />
      <CssBaseline />
      {children}
    </CssVarsProvider>
  );
}