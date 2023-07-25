"use client"
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { SortProps, useSort } from "../hooks/useSort";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import { alpha } from "@mui/material";
import { memo } from 'react';
import isEqual from 'fast-deep-equal';

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
      >
        {sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
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

const genericMemo: <T>(component: T, propsAreEqual: (prevProps: React.PropsWithChildren<T>, nextProps: React.PropsWithChildren<T>) => boolean) => T = memo;
export default genericMemo(SortControl, isEqual);