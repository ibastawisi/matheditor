import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import FormatColorResetIcon from '@mui/icons-material/FormatColorReset';
import ToggleButton from '@mui/material/ToggleButton';
import CircleIcon from '@mui/icons-material/Circle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import ListItemText from '@mui/material/ListItemText';

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

export default function ColorPicker({ variant, onColorChange, toggle = "togglebutton" }
  : { variant: "text" | "background", onColorChange: (key: string, value: string) => void,
   toggle?: "togglebutton" | "menuitem" }): JSX.Element {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const colorPalette = variant === "text" ? textPalete : backgroundPalete;

  return (
    <>
      {toggle === "menuitem" && <MenuItem onClick={handleClick}>
        <ListItemText>
          {variant === "text" ? "Text" : "Background"} color
        </ListItemText>
      </MenuItem>
      }
      {toggle === "togglebutton" && <ToggleButton size='small' value={variant} onClick={handleClick} className="MuiToggleButtonGroup-grouped MuiToggleButtonGroup-groupedHorizontal">
        {variant === "text" ? <FormatColorTextIcon /> : <FormatColorFillIcon />}
      </ToggleButton>}
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 'ul': { display: 'flex', flexWrap: 'wrap', width: 168 } }}
      >
        {colorPalette.map((color, index) => (
          <MenuItem key={index} onClick={e => { handleClose(); onColorChange(variant, color); }}>
            {variant === "text" ?
              <CircleOutlinedIcon style={{ color }} /> :
              <CircleIcon style={{ backgroundColor: color, color: 'transparent' }} />
            }
          </MenuItem>
        ))}
        <MenuItem onClick={e => { handleClose(); onColorChange(variant, 'inherit'); }}>
          {variant === "text" ? <FormatClearIcon /> : <FormatColorResetIcon />}
        </MenuItem>
      </Menu>
    </>
  );
}