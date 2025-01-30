import type { UserDocument } from "@/types";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { Box, ToggleButton, Select, MenuItem, ListItemText, SelectChangeEvent } from "@mui/material";
import type { } from '@mui/material/themeCssVarsAugmentation';

function compareObjectsByKey(key: string, ascending = true) {
  return function innerSort(objectA: any, objectB: any) {
    const valueA = key.split('.').reduce((o: any, i) => o[i], objectA);
    const valueB = key.split('.').reduce((o: any, i) => o[i], objectB);
    const sortValue = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    return ascending ? sortValue : -1 * sortValue;
  };
}

export const sortDocuments = (documents: UserDocument[], sort: { key: string, direction: "asc" | "desc" }) => {
  const { key, direction } = sort;
  const data = documents.map(d => (d.local ?? d.cloud)!);
  const sortedData = [...data].sort(compareObjectsByKey(key, direction === 'asc'));
  const sortedDocuments = sortedData.map(localDocument => documents.find(d => d.id === localDocument.id)!);
  return sortedDocuments;
};


const DocumentSortControl: React.FC<{
  value: { key: string, direction: "asc" | "desc" },
  setValue: (value: { key: string, direction: "asc" | "desc" }) => void,
}> = ({ value, setValue }) => {
  const { key: sortKey, direction: sortDirection } = value;

  const sortOptions = [
    { label: 'Updated', value: 'updatedAt' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
  ];

  const handleSortKeyChange = (event: SelectChangeEvent) => {
    const newSortKey = event.target.value;
    if (sortKey !== newSortKey) {
      setValue({ ...value, key: newSortKey });
    }
  };

  const handleDirectionToggle = () => {
    const newSortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setValue({ ...value, direction: newSortDirection });
  };


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
          borderColor: `rgb(from ${theme.vars.palette.primary.main} r g b / 0.5)`,
          '&:hover': { borderColor: 'primary.main' },
        })}
        aria-label="sort direction"
      >
        {sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
      </ToggleButton>
      <Select
        value={sortKey}
        onChange={handleSortKeyChange}
        sx={theme => ({
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0.5 },
          '& .MuiListItemIcon-root': { minWidth: 30 },
          '& .MuiOutlinedInput-notchedOutline': { borderWidth: 1, borderColor: `rgb(from ${theme.vars.palette.primary.main} r g b / 0.5)` },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
        })}
        inputProps={{ 'aria-label': 'sort by' }}
      >
        {sortOptions.map(option => (
          <MenuItem value={option.value} key={option.value}>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}

      </Select>
    </Box>
  );
};

export default DocumentSortControl;