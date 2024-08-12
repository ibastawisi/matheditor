"use client"
import * as React from 'react';
import { MenuItem, ListItemText, ToggleButton, Menu, ListSubheader, ListItemIcon } from '@mui/material';
import { FormatColorFill, CircleOutlined, FormatClear, FormatColorReset, Circle } from '@mui/icons-material';

const textPalete = [
  "#d7170b",
  "#fe8a2b",
  "#ffc02b",
  "#63b215",
  "#21ba3a",
  "#17cfcf",
  "#0d80f2",
  "#a219e6",
  "#eb4799",
  "#000000",
  "#666666",
  "#A6A6A6",
  "#d4d5d2",
  "#ffffff",
]

const backgroundPalete = [
  "#fbbbb6",
  "#ffe0c2",
  "#fff1c2",
  "#d0e8b9",
  "#bceac4",
  "#b9f1f1",
  "#b6d9fb",
  "#e3baf8",
  "#f9c8e0",
  "#353535",
  "#8C8C8C",
  "#D0D0D0",
  "#F0F0F0",
  "#ffffff",
];

export default function ColorPicker({ onColorChange, onClose, toggle = "togglebutton", label = "Color", textColor, backgroundColor }
  : {
    onColorChange: (key: string, value: string) => void,
    onClose?: () => void,
    toggle?: "togglebutton" | "menuitem",
    label?: string,
    textColor?: string,
    backgroundColor?: string
  }): JSX.Element {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setAnchorEl(open ? null : event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
    onClose?.();
  };
  const onChange = (key: string, value: string) => {
    onColorChange(key, value);
  }

  return (
    <>
      {toggle === "menuitem" && <MenuItem onClick={handleClick}>
        <ListItemIcon>
          <FormatColorFill />
        </ListItemIcon>
        <ListItemText>{label}</ListItemText>
      </MenuItem>
      }
      {toggle === "togglebutton" && <ToggleButton size='small' value="color" onClick={handleClick} className="MuiToggleButtonGroup-grouped MuiToggleButtonGroup-groupedHorizontal" selected={open}>
        <FormatColorFill />
      </ToggleButton>}
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} disableRestoreFocus
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          'ul': { pt: 0, display: 'flex', flexWrap: 'wrap', width: 280 },
          '& .MuiBackdrop-root': { userSelect: 'none' }
        }}

      >
        <ListSubheader key="text" sx={{ width: "100%" }}>Text</ListSubheader>
        {textPalete.map((color, index) => (
          <MenuItem key={index} onClick={e => { onChange("text", color); }} selected={color === textColor}>
            <CircleOutlined style={{ color }} />
          </MenuItem>
        ))}
        <MenuItem key="clear-color" onClick={e => { onChange("text", 'inherit'); }} selected={textColor === 'inherit'}>
          <FormatClear />
        </MenuItem>
        <ListSubheader key="background" sx={{ width: "100%" }}>Background</ListSubheader>
        {backgroundPalete.map((color, index) => (
          <MenuItem key={index} onClick={e => { onChange("background", color); }} selected={color === backgroundColor}>
            <Circle style={{ backgroundColor: color, color: 'transparent' }} />
          </MenuItem>
        ))}
        <MenuItem key="clear-background" onClick={e => { onChange("background", 'inherit'); }} selected={backgroundColor === 'inherit'}>
          <FormatColorReset />
        </MenuItem>
      </Menu>
    </>
  );
}