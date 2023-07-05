import { SelectChangeEvent } from '@mui/material/Select';
import { ChangeEvent, useEffect, useState } from 'react';

export type SortDirection = "asc" | "desc";

export type ItemKey<T> = keyof T;

/**
 * Mapped type to convert a supplied generic list item type `T`
 * a label / value pair for use in a select control.
 */
export type SortOption<T> = {
  label: T[ItemKey<T>];
  value: ItemKey<T>;
};
export interface SortProps<T> {
  data: T[];
  onSortChange(data: T[]): void;
  sortOptions: SortOption<T>[];
  initialSortKey?: ItemKey<T>;
  initialSortDirection?: SortDirection;
}

function compareObjectsByKey<T>(key: keyof T, ascending = true) {
  return function innerSort(objectA: T, objectB: T) {
    const sortValue =
      objectA[key] > objectB[key] ? 1 : objectA[key] < objectB[key] ? -1 : 0;
    return ascending ? sortValue : -1 * sortValue;
  };
}

export function useSort<T>({ data, onSortChange, sortOptions, initialSortKey, initialSortDirection }: SortProps<T>) {
  // Local state
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection ?? 'asc');
  const [sortKey, setSortKey] = useState<ItemKey<T>>(initialSortKey ?? sortOptions[0].value);

  // Execute the sort and callback when local state
  // or supplied props have changed.
  useEffect(() => {
    // Create a copy before sorting, as the original array is frozen in strict mode.
    const sortedData = [...data];
    if (sortedData?.length) {
      sortedData.sort(compareObjectsByKey(sortKey, sortDirection === 'asc'));

      if (onSortChange) {
        onSortChange(sortedData);
      }
    }
  }, [data, onSortChange, sortDirection, sortKey]);

  const handleSortKeyChange = (event: SelectChangeEvent) => {
    const newSortKey = event.target.value as ItemKey<T>;
    if (sortKey !== newSortKey) {
      setSortKey(newSortKey);
    }
  };

  const handleDirectionToggle = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return {
    handleDirectionToggle,
    handleSortKeyChange,
    sortDirection,
    sortKey,
  };
}