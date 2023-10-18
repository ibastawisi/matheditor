"use client"
import { LexicalEditor, } from "lexical";
import { $patchStyle, getStyleObjectFromCSS } from '../../../nodes/utils';
import { useEffect, useState } from "react";
import { ToggleButtonGroup, ToggleButton, SvgIcon, Menu, Button, MenuItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { ViewHeadline, Delete, KeyboardArrowDown, DeleteForever, TableChart } from "@mui/icons-material";
import { TableNode } from "@/editor/nodes/TableNode";
import { FormatAlignLeft, FormatAlignCenter, FormatAlignRight, FormatAlignJustify } from '@mui/icons-material';

const FormatImageRight = () => <SvgIcon viewBox='0 -960 960 960'>
  <path xmlns="http://www.w3.org/2000/svg" d="M450-285v-390h390v390H450Zm60-60h270v-270H510v270ZM120-120v-60h720v60H120Zm0-165v-60h270v60H120Zm0-165v-60h270v60H120Zm0-165v-60h270v60H120Zm0-165v-60h720v60H120Z" />
</SvgIcon>;

const FormatImageLeft = () => <SvgIcon viewBox='0 -960 960 960'>
  <path xmlns="http://www.w3.org/2000/svg" d="M120-285v-390h390v390H120Zm60-60h270v-270H180v270Zm-60-435v-60h720v60H120Zm450 165v-60h270v60H570Zm0 165v-60h270v60H570Zm0 165v-60h270v60H570ZM120-120v-60h720v60H120Z" />
</SvgIcon>;


export default function TableTools({ editor, node }: { editor: LexicalEditor, node: TableNode }): JSX.Element {

  const [style, setStyle] = useState(currentNodeStyle());

  function currentNodeStyle(): Record<string, string> | null {
    return editor.getEditorState().read(() => {
      if ('getStyle' in node === false) return null;
      const css = node.getStyle();
      if (!css) return null;
      const style = getStyleObjectFromCSS(css);
      return style;
    });
  }

  useEffect(() => {
    setStyle(currentNodeStyle());
  }, [node]);

  function updateStyle(newStyle: Record<string, string>) {
    setStyle({ ...style, ...newStyle });
    editor.update(() => {
      $patchStyle([node], newStyle);
    });
  }
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        id="table-tools-button"
        aria-controls={open ? 'table-tools-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="outlined"
        onClick={handleClick}
        startIcon={<TableChart />}
        endIcon={<KeyboardArrowDown />}
        sx={{
          color: 'text.primary',
          borderColor: 'divider',
          height: 40,
          '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.5 } }
        }}
      >
        <Typography variant="button" sx={{ display: { xs: "none", sm: "block" } }}>Table</Typography>
      </Button>
      <Menu id="table-tools-menu" aria-label="Formatting options for table"
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
      >
        <MenuItem>
          <ToggleButtonGroup size="small" sx={{ width: "100%", justifyContent: "center" }}>
            <ToggleButton value="align-left" key="align-left" selected={style?.margin === "0 auto 0 0"}
              onClick={() => {
                updateStyle({ "float": "none", "margin": "0 auto 0 0", "table-layout": "auto", "width": "auto" });
              }}>
              <FormatAlignLeft />
            </ToggleButton>
            <ToggleButton value="align-none" key="align-none" selected={style?.margin === "0 auto"}
              onClick={() => {
                updateStyle({ "float": "none", "margin": "0 auto", "table-layout": "auto", "width": "auto" });
              }}>
              <FormatAlignCenter />
            </ToggleButton>,
            <ToggleButton value="align-right" key="align-right" selected={style?.margin === "0 0 0 auto"}
              onClick={() => {
                updateStyle({ "float": "none", "margin": "0 0 0 auto", "table-layout": "auto", "width": "auto" });
              }}>
              <FormatAlignRight />
            </ToggleButton>
          </ToggleButtonGroup>
        </MenuItem>
        <MenuItem>
          <ToggleButtonGroup size="small" sx={{ width: "100%", justifyContent: "center" }}>
            <ToggleButton value="float-left" key="float-left" selected={style?.float === "left"}
              onClick={() => {
                updateStyle({ "float": "left", "margin": "0 1em 0 0", "table-layout": "auto", "width": "auto" });
              }}>
              <FormatImageLeft />
            </ToggleButton>
            <ToggleButton value="float-none" key="float-none" selected={!style || (style.float === "none" && style.width === "100%")}
              onClick={() => {
                updateStyle({ "float": "none", "margin": "0", "table-layout": "fixed", "width": "100%" });
              }}>
              <ViewHeadline />
            </ToggleButton>,
            <ToggleButton value="float-right" key="float-right" selected={style?.float === "right"}
              onClick={() => {
                updateStyle({ "float": "right", "margin": "0 0 0 1em", "table-layout": "auto", "width": "auto" });
              }}>
              <FormatImageRight />
            </ToggleButton>
          </ToggleButtonGroup>

        </MenuItem>
        <MenuItem onClick={() => {
          editor.update(() => {
            node.selectPrevious();
            node.remove();
          });
        }}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Table</ListItemText>
        </MenuItem>
      </Menu>
    </>

  );
}