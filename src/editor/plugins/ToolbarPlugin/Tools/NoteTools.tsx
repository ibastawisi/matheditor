"use client"
import { LexicalEditor, } from "lexical";
import { useEffect, useState } from "react";
import { ToggleButtonGroup, ToggleButton, SvgIcon, Menu, Button, MenuItem, ListItemIcon, ListItemText, Typography, Divider } from "@mui/material";
import { Delete, KeyboardArrowDown, Note } from "@mui/icons-material";
import { $getNodeStyleValueForProperty, $patchStyle } from "@/editor/nodes/utils";
import ColorPicker from "./ColorPicker";
import { StickyNode } from "@/editor/nodes/StickyNode";

const FormatImageRight = () => <SvgIcon viewBox='0 -960 960 960'>
  <path xmlns="http://www.w3.org/2000/svg" d="M450-285v-390h390v390H450Zm60-60h270v-270H510v270ZM120-120v-60h720v60H120Zm0-165v-60h270v60H120Zm0-165v-60h270v60H120Zm0-165v-60h270v60H120Zm0-165v-60h720v60H120Z" />
</SvgIcon>;

const FormatImageLeft = () => <SvgIcon viewBox='0 -960 960 960'>
  <path xmlns="http://www.w3.org/2000/svg" d="M120-285v-390h390v390H120Zm60-60h270v-270H180v270Zm-60-435v-60h720v60H120Zm450 165v-60h270v60H570Zm0 165v-60h270v60H570Zm0 165v-60h270v60H570ZM120-120v-60h720v60H120Z" />
</SvgIcon>;


export default function NoteTools({ editor, node }: { editor: LexicalEditor, node: StickyNode }) {
  const [float, setFloat] = useState<string>();
  const [textColor, setTextColor] = useState<string>();
  const [backgroundColor, setBackgroundColor] = useState<string>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    editor.getEditorState().read(() => {
      const float = $getNodeStyleValueForProperty(node, 'float');
      setFloat(float);
      const color = $getNodeStyleValueForProperty(node, 'color');
      setTextColor(color);
      const backgroundColor = $getNodeStyleValueForProperty(node, 'background-color');
      setBackgroundColor(backgroundColor);
    });
  }, [node]);

  const deleteNode = () => {
    editor.update(() => {
      node.selectPrevious();
      node.remove();
      handleClose();
    });
  }

  const updateNoteColor = (key: string, value: string) => {
    const styleKey = key === 'text' ? 'color' : 'background-color';
    updateColor(styleKey, value);
  };

  function updateFloat(newFloat: 'left' | 'right' | 'none') {
    setFloat(newFloat);
    editor.update(() => {
      node.select();
      $patchStyle(node, { float: newFloat });
    });
  }

  function updateColor(key: 'color' | 'background-color', value: string) {
    key === 'color' ? setTextColor(value) : setBackgroundColor(value);
    editor.update(() => {
      node.select();
      $patchStyle(node, { [key]: value });
    });
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const restoreFocus = () => {
    setTimeout(() => node.focus(), 0);
  };

  const handleClose = () => {
    setAnchorEl(null);
    restoreFocus();
  };

  useEffect(() => {
    if (!open) return
    editor.update(() => {
      node.select();
    });
  }, [open]);
  return (
    <>
      <Button
        id="note-tools-button"
        aria-controls={open ? 'note-tools-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="outlined"
        onClick={handleClick}
        startIcon={<Note />}
        endIcon={<KeyboardArrowDown />}
        sx={{
          color: 'text.primary',
          borderColor: 'divider',
          height: 36,
          '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.5 } }
        }}
      >
        <Typography variant="button" sx={{ display: { xs: "none", sm: "block" } }}>Note</Typography>
      </Button>
      <Menu id="note-tools-menu" aria-label="Formatting options for note"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiBackdrop-root': { userSelect: 'none' },
        }}
      >
        <MenuItem>
          <ToggleButtonGroup size="small" sx={{ width: "100%", justifyContent: "center" }}>
            <ToggleButton value="float-left" key="float-left" selected={float === "left"}
              onClick={() => {
                updateFloat("left");
              }}>
              <FormatImageLeft />
            </ToggleButton>
            <ToggleButton value="float-right" key="float-right" selected={float === "right"}
              onClick={() => {
                updateFloat("right");
              }}>
              <FormatImageRight />
            </ToggleButton>
          </ToggleButtonGroup>
        </MenuItem>
        <Divider />
        <ColorPicker
          onColorChange={updateNoteColor}
          toggle="menuitem"
          label='Note color'
          textColor={textColor}
          backgroundColor={backgroundColor}
        />
        <MenuItem onClick={deleteNode}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Note</ListItemText>
        </MenuItem>
      </Menu>
    </>

  );
}