import { TextDecrease, TextIncrease } from "@mui/icons-material";
import { Box, IconButton, TextField } from "@mui/material";
import { useCallback } from "react";

const MIN_ALLOWED_FONT_SIZE = 8;
const MAX_ALLOWED_FONT_SIZE = 72;

export const FontSizePicker = ({ fontSize, updateFontSize, onBlur }: {
  fontSize: string,
  updateFontSize: (fontSize: number) => void,
  onBlur: () => void,
}): JSX.Element => {
  const increaseFontSize = useCallback(() => {
    const currentFontSize = parseInt(fontSize);
    let updatedFontSize = currentFontSize;
    switch (true) {
      case currentFontSize < MIN_ALLOWED_FONT_SIZE:
        updatedFontSize = MIN_ALLOWED_FONT_SIZE;
        break;
      case currentFontSize < 12:
        updatedFontSize += 1;
        break;
      case currentFontSize < 20:
        updatedFontSize += 2;
        break;
      case currentFontSize < 36:
        updatedFontSize += 4;
        break;
      case currentFontSize <= 60:
        updatedFontSize += 12;
        break;
      default:
        updatedFontSize = MAX_ALLOWED_FONT_SIZE;
        break;
    }
    updateFontSize(updatedFontSize);
  }, [fontSize, updateFontSize]);

  const decreaseFontSize = useCallback(() => {
    const currentFontSize = parseInt(fontSize);
    let updatedFontSize = currentFontSize;
    switch (true) {
      case currentFontSize > MAX_ALLOWED_FONT_SIZE:
        updatedFontSize = MAX_ALLOWED_FONT_SIZE;
        break;
      case currentFontSize >= 48:
        updatedFontSize -= 12;
        break;
      case currentFontSize >= 24:
        updatedFontSize -= 4;
        break;
      case currentFontSize >= 14:
        updatedFontSize -= 2;
        break;
      case currentFontSize >= 9:
        updatedFontSize -= 1;
        break;
      default:
        updatedFontSize = MIN_ALLOWED_FONT_SIZE;
        break;
    }
    updateFontSize(updatedFontSize);
  }, [fontSize, updateFontSize]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
      <IconButton
        disabled={parseInt(fontSize) <= MIN_ALLOWED_FONT_SIZE}
        onClick={e => {
          e.stopPropagation();
          decreaseFontSize();
          onBlur();
        }}
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
        value={parseInt(fontSize) || ''}
        onChange={(e) => {
          updateFontSize(parseInt(e.target.value || '0') % 100);
          e.target.focus();
        }}
        onClick={(e) => e.stopPropagation()}
        onBlur={(e) => {
          const inputValue = parseInt(e.target.value || '0') % 100;
          const prevValue = parseInt(fontSize);
          if (inputValue !== prevValue) return;
          if (inputValue < MIN_ALLOWED_FONT_SIZE) updateFontSize(MIN_ALLOWED_FONT_SIZE);
          if (inputValue > MAX_ALLOWED_FONT_SIZE) updateFontSize(MAX_ALLOWED_FONT_SIZE);
        }}
        inputProps={{
          min: MIN_ALLOWED_FONT_SIZE,
          max: MAX_ALLOWED_FONT_SIZE,
          onKeyDown: (e) => {
            const input = e.currentTarget;
            const isEscaping = e.key === "Escape";
            if (isEscaping) return onBlur();
            const isNavigatingUp = e.key === "ArrowUp";
            const isNavigatingDown = e.key === "ArrowDown";
            if (!isNavigatingUp && !isNavigatingDown) e.stopPropagation();
            const menuItem = input.closest("li");
            if (!menuItem) return;
            if (isNavigatingDown) menuItem.focus();
          },
          "aria-label": "font size",
        }}
      />
      <IconButton
        disabled={parseInt(fontSize) >= MAX_ALLOWED_FONT_SIZE}
        onClick={e => {
          e.stopPropagation();
          increaseFontSize();
          onBlur();
        }}
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
  );
};