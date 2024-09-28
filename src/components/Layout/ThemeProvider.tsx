"use client"
import { CssBaseline } from "@mui/material";
import { ThemeProvider as MuiThemeProvider, createTheme, extendTheme } from '@mui/material/styles';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = createTheme({
    colorSchemes: { light: true, dark: true },
    cssVariables: { colorSchemeSelector: 'media', }
  });

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}