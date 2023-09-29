"use client"
import { SortProps, useSort } from "../hooks/useSort";
import { alpha } from "@mui/material/styles";
import { Box, ToggleButton, Select, MenuItem, ListItemText } from '@mui/material';
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";

function SortControl<T>(props: SortProps<T>) {
  const { sortOptions } = props;
  const {
    handleDirectionToggle,
    handleSortKeyChange,
    sortDirection,
    sortKey
  } = useSort(props);
  return (
    <Box sx={{ display: 'flex' }}>
      <ToggleButton
        size="small"
        value="sort-direction"
        onChange={handleDirectionToggle}
        sx={theme => ({
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          borderRight: 'none',
          borderColor: alpha(theme.palette.primary.main, 0.5),
          '&:hover': { borderColor: 'primary.main' },
        })}
        aria-label="sort direction"
      >
        {sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
      </ToggleButton>
      <Select
        labelId="sort-select-label"
        id="sort-select"
        value={sortKey}
        onChange={handleSortKeyChange}
        sx={theme => ({
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0.5 },
          '& .MuiListItemIcon-root': { minWidth: 30 },
          '& .MuiOutlinedInput-notchedOutline': { borderWidth: 1, borderColor: alpha(theme.palette.primary.main, 0.5) },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
        })}
      >
        {sortOptions.map(option => (
          <MenuItem value={option.value} key={option.value}>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}

      </Select>
    </Box>
  );
}

export default SortControl;