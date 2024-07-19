import { Undo, Redo, Add, FormatAlignLeft } from "@mui/icons-material";
import { AppBar, Toolbar, Box, IconButton, useScrollTrigger, Typography } from "@mui/material";
import { PropsWithChildren, useEffect } from "react";

export const EditorSkeleton: React.FC<PropsWithChildren> = ({ children }) => {
  const toolbarTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 32,
  });
  useEffect(() => {
    const lightThemeMeta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
    const darkThemeMeta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
    if (lightThemeMeta && darkThemeMeta) {
      lightThemeMeta.setAttribute('content', toolbarTrigger ? '#ffffff' : '#1976d2');
      darkThemeMeta.setAttribute('content', toolbarTrigger ? '#121212' : '#272727');
    }
  }, [toolbarTrigger]);

  return (
    <>
      <AppBar elevation={toolbarTrigger ? 4 : 0} position={toolbarTrigger ? 'fixed' : 'static'}>
        <Toolbar className="editor-toolbar" sx={{
          position: "relative",
          displayPrint: 'none', px: `${(toolbarTrigger ? 1 : 0)}!important`,
          justifyContent: "space-between", alignItems: "start", gap: 0.5, py: 1,
        }}>
          <Box sx={{ display: "flex" }}>
            <IconButton aria-label="Undo" disabled>
              <Undo />
            </IconButton>
            <IconButton aria-label="Redo" disabled>
              <Redo />
            </IconButton>
          </Box>
          <Box sx={{ display: "flex", gap: 1, margin: 'auto', justifyContent: "center", alignItems: "center" }}>
            <Typography variant="overline" color="WindowText">Loading Editor</Typography>
          </Box>
          <Box sx={{ display: "flex", gridColumn: "3/-1" }}>
            <IconButton aria-label='Insert' disabled>
              <Add />
            </IconButton>
            <IconButton aria-label='Align Text' disabled>
              <FormatAlignLeft />
            </IconButton>
          </Box>
        </Toolbar >
      </AppBar>
      {toolbarTrigger && <Box sx={(theme) => ({ ...theme.mixins.toolbar, displayPrint: "none" })} />}
      {children}
    </>
  );
}