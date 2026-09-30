import { useMediaQuery } from "@mui/material";

// The MUI theme uses CSS variables with the `media` color scheme selector,
// so `theme.palette.mode` is always "light" in JS. Read the system preference instead.
function useColorMode(): "light" | "dark" {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)", { noSsr: true });
  return prefersDark ? "dark" : "light";
}

export default useColorMode;
