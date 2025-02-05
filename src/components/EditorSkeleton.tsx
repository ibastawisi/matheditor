"use client"
import { Undo, Redo, Add, FormatAlignLeft, ViewHeadline, ArrowDropDown, AutoAwesome, TextDecrease, TextIncrease, Code, FormatBold, FormatItalic, FormatStrikethrough, FormatUnderlined, Subscript, Superscript, Link, FormatColorFill } from "@mui/icons-material";
import { AppBar, Toolbar, Box, IconButton, useScrollTrigger, Typography, ListItemIcon, ListItemText, MenuItem, Select, Button, TextField, ToggleButton, ToggleButtonGroup, SvgIcon, Container } from "@mui/material";
import { PropsWithChildren, useEffect } from "react";

const Highlight = () => <SvgIcon viewBox='0 -960 960 960'>
  <path xmlns="http://www.w3.org/2000/svg" d="M80 0v-160h800V0H80Zm504-480L480-584 320-424l103 104 161-160Zm-47-160 103 103 160-159-104-104-159 160Zm-84-29 216 216-189 190q-24 24-56.5 24T367-263l-27 23H140l126-125q-24-24-25-57.5t23-57.5l189-189Zm0 0 187-187q24-24 56.5-24t56.5 24l104 103q24 24 24 56.5T857-640L669-453 453-669Z" />
</SvgIcon>;


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
      <AppBar elevation={toolbarTrigger ? 4 : 0} position={toolbarTrigger ? 'fixed' : 'static'}
        sx={{
          background: 'var(--mui-palette-background-default) !important',
          transition: 'none'
        }}>
        <Toolbar className="editor-toolbar" sx={{
          position: "relative", displayPrint: 'none', alignItems: "center",
          px: '0 !important', py: 1,
        }}>
          <Container sx={{ display: "flex", gap: 0.5, justifyContent: "space-between", alignItems: "center", px: toolbarTrigger ? '' : '0 !important', }}>
            <Box sx={{ display: "flex", alignSelf: 'start', my: { xs: 0, sm: 0.5 } }}>
              <IconButton aria-label="Undo" disabled>
                <Undo />
              </IconButton>
              <IconButton aria-label="Redo" disabled>
                <Redo />
              </IconButton>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5, mx: 'auto', flexWrap: "wrap", justifyContent: "center" }}>
              <Select value="paragraph" aria-label="Formatting options for text style" size='small'
                sx={{
                  '& .MuiSelect-select': { display: 'flex !important', alignItems: 'center', py: 0.5 },
                  '& .MuiListItemIcon-root': { mr: { md: 0.5 }, minWidth: 20 },
                  '& .MuiListItemText-root': { display: { xs: "none", md: "flex" } },
                  fieldset: { borderColor: 'divider' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                }}
                MenuProps={{
                  slotProps: {
                    root: { sx: { '& .MuiBackdrop-root': { userSelect: 'none' } } },
                  }
                }}>
                <MenuItem value='paragraph'>
                  <ListItemIcon>
                    <ViewHeadline fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Normal</ListItemText>
                </MenuItem>
              </Select>
              <Box sx={{ display: 'flex', gap: 0.5, height: 40 }}>
                <Select size='small'
                  sx={{
                    '& .MuiSelect-select': { display: 'flex !important', alignItems: 'center', py: 0.5 },
                    '& .MuiListItemIcon-root': { mr: { md: 0.5 }, minWidth: 20 },
                    '& .MuiListItemText-root': { display: { xs: "none", md: "flex" } },
                    fieldset: { borderColor: 'divider' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                  }}
                  MenuProps={{
                    slotProps: {
                      root: { sx: { '& .MuiBackdrop-root': { userSelect: 'none' } } },
                      paper: {
                        sx: {
                          '& .MuiList-root': { pt: 0 },
                        }
                      }
                    }
                  }}
                  value="Roboto"
                >
                  <MenuItem key={"Roboto"} value={"Roboto"}>
                    <ListItemIcon sx={{ fontFamily: "Roboto", fontWeight: 500 }} color="action">Aa</ListItemIcon>
                    <ListItemText sx={{ '& *': { fontFamily: "Roboto" } }}>Roboto</ListItemText>
                  </MenuItem>
                </Select>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <IconButton
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      borderRight: 'none',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'divider',
                      '&:hover': { borderColor: 'primary.main' },
                    }}
                    aria-label="increase font size"
                  >
                    <TextDecrease fontSize="small" />
                  </IconButton>
                  <TextField
                    hiddenLabel
                    variant="outlined"
                    size="small"
                    autoComplete="off"
                    spellCheck="false"
                    sx={{
                      width: 48,
                      fieldset: { borderColor: 'divider' },
                      '& .MuiInputBase-root': {
                        borderRadius: 0,
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                      },
                      '& .MuiInputBase-input': {
                        textAlign: 'center',
                        MozAppearance: 'textfield',
                        '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { appearance: 'none', margin: 0 },
                      },
                    }}
                    type="number"
                    value={16}
                  />
                  <IconButton
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'divider',
                      '&:hover': { borderColor: 'primary.main' },
                    }}
                    aria-label="decrease font size"
                  >
                    <TextIncrease fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Button
                id="ai-tools-button"
                aria-haspopup="true"
                variant="outlined"
                startIcon={<AutoAwesome color={"action"} />}
                endIcon={<ArrowDropDown color={"action"} />}
                sx={{
                  color: 'text.primary',
                  borderColor: 'divider',
                  width: { xs: 66, md: 'auto' },
                  height: 40,
                  '& .MuiButton-startIcon': { mr: { xs: 0, md: 1 } },
                  '& .MuiButton-endIcon': { mr: -1, ml: 0 },
                  '& .MuiButton-endIcon > svg': { fontSize: 24 },
                }}
              >
                <Typography variant="button" sx={{ display: { xs: "none", md: "block" } }}>AI</Typography>
              </Button>
              <ToggleButtonGroup size="small" sx={{ display: { xs: "none", lg: "flex" } }}>
                <ToggleButton value="bold">
                  <FormatBold />
                </ToggleButton>
                <ToggleButton value="italic">
                  <FormatItalic />
                </ToggleButton>
                <ToggleButton value="underline">
                  <FormatUnderlined />
                </ToggleButton>
                <ToggleButton value="highlight">
                  <Highlight />
                </ToggleButton>
                <ToggleButton value="code" >
                  <Code />
                </ToggleButton>
                <ToggleButton value="strikethrough" >
                  <FormatStrikethrough />
                </ToggleButton>
                <ToggleButton value="subscript" >
                  <Subscript />
                </ToggleButton>
                <ToggleButton value="superscript" >
                  <Superscript />
                </ToggleButton>
                <ToggleButton value="link" >
                  <Link />
                </ToggleButton>
                <ToggleButton value="color">
                  <FormatColorFill />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ display: "flex", alignSelf: 'start', my: { xs: 0, sm: 0.5 } }}>
              <IconButton aria-label='Insert'>
                <Add />
              </IconButton>
              <IconButton aria-label='Align Text'>
                <FormatAlignLeft />
              </IconButton>
            </Box>
          </Container>
        </Toolbar >
      </AppBar>
      {toolbarTrigger && <Box sx={(theme) => ({ ...theme.mixins.toolbar, displayPrint: "none" })} />}
      <div className="document-container">{children}</div>
    </>
  );
}