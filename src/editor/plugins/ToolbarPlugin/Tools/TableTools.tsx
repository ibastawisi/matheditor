"use client"
import { ElementFormatType, LexicalEditor, } from "lexical";
import { useEffect, useState } from "react";
import { ToggleButtonGroup, ToggleButton, SvgIcon, Menu, Button, MenuItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { ViewHeadline, Delete, KeyboardArrowDown, TableChart } from "@mui/icons-material";
import { TableNode } from "@/editor/nodes/TableNode";
import { FormatAlignLeft, FormatAlignCenter, FormatAlignRight } from '@mui/icons-material';
import { $getNodeStyleValueForProperty, $patchStyle } from "@/editor/nodes/utils";

const FormatImageRight = () => <SvgIcon viewBox='0 -960 960 960'>
  <path xmlns="http://www.w3.org/2000/svg" d="M450-285v-390h390v390H450Zm60-60h270v-270H510v270ZM120-120v-60h720v60H120Zm0-165v-60h270v60H120Zm0-165v-60h270v60H120Zm0-165v-60h270v60H120Zm0-165v-60h720v60H120Z" />
</SvgIcon>;

const FormatImageLeft = () => <SvgIcon viewBox='0 -960 960 960'>
  <path xmlns="http://www.w3.org/2000/svg" d="M120-285v-390h390v390H120Zm60-60h270v-270H180v270Zm-60-435v-60h720v60H120Zm450 165v-60h270v60H570Zm0 165v-60h270v60H570Zm0 165v-60h270v60H570ZM120-120v-60h720v60H120Z" />
</SvgIcon>;


export default function TableTools({ editor, node }: { editor: LexicalEditor, node: TableNode }): JSX.Element {

  const [formatType, setFormatType] = useState(getNodeFormatType());
  const [float, setFloat] = useState(getNodeFloat());

  function getNodeFormatType(): ElementFormatType {
    return editor.getEditorState().read(() => {
      return node.getFormatType();
    });
  }
  function getNodeFloat(): string {
    return editor.getEditorState().read(() => {
      return $getNodeStyleValueForProperty(node, "float", "none");
    });
  }

  useEffect(() => {
    setFormatType(getNodeFormatType());
    setFloat(getNodeFloat());
  }, [node]);

  function updateFloat(newFloat: 'left' | 'right' | 'none'){
    setFloat(newFloat);
    editor.update(() => {
      $patchStyle(node, { float: newFloat });
    });
  }

  function updateFormat(newFormat: ElementFormatType) {
    updateFloat("none");
    setFormatType(newFormat);
    editor.update(() => {
      node.setFormat(newFormat);
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
            <ToggleButton value="align-left" key="align-left" selected={formatType === "left"}
              onClick={() => {
                updateFormat('left');
              }}>
              <FormatAlignLeft />
            </ToggleButton>
            <ToggleButton value="align-center" key="align-center" selected={formatType === "center"}
              onClick={() => {
                updateFormat('center');
              }}>
              <FormatAlignCenter />
            </ToggleButton>,
            <ToggleButton value="align-right" key="align-right" selected={formatType === "right"}
              onClick={() => {
                updateFormat('right');
              }}>
              <FormatAlignRight />
            </ToggleButton>
          </ToggleButtonGroup>
        </MenuItem>
        <MenuItem>
          <ToggleButtonGroup size="small" sx={{ width: "100%", justifyContent: "center" }}>
            <ToggleButton value="float-left" key="float-left" selected={float === "left"}
              onClick={() => {
                updateFloat("left");
              }}>
              <FormatImageLeft />
            </ToggleButton>
            <ToggleButton value="align-justify" key="align-justify" selected={formatType === "justify"}
              onClick={() => {
                updateFormat('justify');
              }}>
              <ViewHeadline />
            </ToggleButton>,
            <ToggleButton value="float-right" key="float-right" selected={float === "right"}
              onClick={() => {
                updateFloat("right");
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