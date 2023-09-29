import { LocalDocument, UserDocument } from "@/types";
import SortControl from "./SortControl";
import { SortOption } from "@/hooks/useSort";
import { memo } from "react";
import isEqual from 'fast-deep-equal';

const DocumentSortControl: React.FC<{
  documents: UserDocument[],
  setDocuments: React.Dispatch<React.SetStateAction<UserDocument[]>>
}> = memo(({ documents, setDocuments }) => {
  const localDocuments = documents.map(d => (d.local ?? d.cloud)!);
  const setSortedDocuments = (sortedLocalDocuments: LocalDocument[]) => {
    const sortedUserDocuments = sortedLocalDocuments.map(localDocument => documents.find(d => d.id === localDocument.id)!);
    setDocuments(sortedUserDocuments);
  }

  const documentSortOptions: SortOption<LocalDocument>[] = [
    { label: 'Updated', value: 'updatedAt' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
  ];

  return <SortControl<LocalDocument> data={localDocuments} onSortChange={setSortedDocuments} sortOptions={documentSortOptions} initialSortDirection="desc" />
}, isEqual);

export default DocumentSortControl;