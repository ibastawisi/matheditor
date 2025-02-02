import type { UserDocument } from "@/types";

function compareObjectsByKey(key: string, ascending = true) {
  return function innerSort(objectA: any, objectB: any) {
    const valueA = key.split('.').reduce((o: any, i) => o[i], objectA);
    const valueB = key.split('.').reduce((o: any, i) => o[i], objectB);
    const sortValue = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    return ascending ? sortValue : -1 * sortValue;
  };
}

export const sortDocuments = (documents: UserDocument[], sortkey: string, sortDirection: "asc" | "desc") => {
  const data = documents.map(d => (d.local ?? d.cloud)!);
  const sortedData = [...data].sort(compareObjectsByKey(sortkey, sortDirection === 'asc'));
  const sortedDocuments = sortedData.map(localDocument => documents.find(d => d.id === localDocument.id)!);
  return sortedDocuments;
};
