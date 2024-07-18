import "mathlive/static.css"
import '@/editor/theme.css';
import { Undo, Redo, Add, FormatAlignLeft } from "@mui/icons-material";
import { AppBar, Toolbar, Box, IconButton, useScrollTrigger, Typography } from "@mui/material";
import { PropsWithChildren } from "react";

export const EditorSkeleton: React.FC<PropsWithChildren> = ({ children }) => {
  const toolbarTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 32,
  });

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
          <Box sx={{ display: "flex", gap: 1, mx: 'auto', justifyContent: "center", alignItems: "center", height: 48 }}>
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