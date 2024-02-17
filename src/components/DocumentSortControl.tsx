import { LocalDocument, UserDocument } from "@/types";
import { memo, useEffect } from "react";
import isEqual from 'fast-deep-equal';
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { Box, ToggleButton, alpha, Select, MenuItem, ListItemText, SelectChangeEvent } from "@mui/material";

function compareObjectsByKey(key: string, ascending = true) {
  return function innerSort(objectA: any, objectB: any) {
    const valueA = key.split('.').reduce((o: any, i) => o[i], objectA);
    const valueB = key.split('.').reduce((o: any, i) => o[i], objectB);
    const sortValue = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    return ascending ? sortValue : -1 * sortValue;
  };
}

const DocumentSortControl: React.FC<{
  documents: UserDocument[],
  setDocuments: React.Dispatch<React.SetStateAction<UserDocument[]>>
  value: { key: string, direction: "asc" | "desc" },
  setValue: (value: { key: string, direction: "asc" | "desc" }) => void,
}> = memo(({ documents, setDocuments, value, setValue }) => {
  const { key: sortKey, direction: sortDirection } = value;
  const data = documents.map(d => (d.local ?? d.cloud)!);
  const setSortedData = (sortedData: LocalDocument[]) => {
    const sortedUserDocuments = sortedData.map(localDocument => documents.find(d => d.id === localDocument.id)!);
    setDocuments(sortedUserDocuments);
  }

  const sortOptions = [
    { label: 'Updated', value: 'updatedAt' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
  ];

  useEffect(() => {
    const sortedData = [...data];
    if (sortedData) {
      sortedData.sort(compareObjectsByKey(sortKey, sortDirection === 'asc'));
      setSortedData(sortedData);
    }
  }, [sortDirection, sortKey]);

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
}, isEqual);

export default DocumentSortControl;