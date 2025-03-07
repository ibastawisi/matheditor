"use client"
import { useRouter, useSearchParams } from 'next/navigation';
import type { UserDocument } from '@/types';
import DocumentCard from "../DocumentCard";
import Grid from '@mui/material/Grid2';
import { Box, Pagination, Typography } from "@mui/material";
import { Pageview } from "@mui/icons-material";
import DocumentSortControl from "../DocumentControls/SortControl";

const UserDocuments: React.FC<{ documents?: UserDocument[], pages?: number }> = ({ documents, pages = 0 }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const sortKey = searchParams.get('sortKey') || 'updatedAt';
  const sortDirection = searchParams.get('sortDirection') || 'desc';
  const showLoading = !documents;
  const showEmpty = !showLoading && !documents.length;

  const handlePageChange = (_: any, value: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 1) params.delete('page');
    else params.set('page', value.toString());
    router.push(`?${params.toString()}`);
  };

  const handleSortChange = (sort: { key: string, direction: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort.key === 'updatedAt') params.delete('sortKey');
    else params.set('sortKey', sort.key);
    if (sort.direction === 'desc') params.delete('sortDirection');
    else params.set('sortDirection', sort.direction);
    router.push(`?${params.toString()}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: "column", flex: 1 }}>
      {!showLoading && !showEmpty && <>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: 'space-between', alignItems: "center", gap: 1, minHeight: 40, position: "sticky", top: { 'xs': 55.99, 'sm': 63.99 }, backgroundColor: 'var(--mui-palette-background-default)', zIndex: 5, py: 1 }}>
          <Typography variant="h6" component="h2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Published Documents</Typography>
          <DocumentSortControl value={{ key: sortKey, direction: sortDirection }} setValue={handleSortChange} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: "column", flex: 1, justifyContent: 'space-between' }}>
          <Grid container spacing={2}>
            {documents.map(document => <Grid key={document.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <DocumentCard userDocument={document} />
            </Grid>)}
          </Grid>
          {pages > 1 && <Pagination count={pages} page={page} onChange={handlePageChange} sx={{ position: "sticky", zIndex: 5, bottom: 0, mx: 'auto', '& .MuiPagination-ul': { backgroundColor: 'var(--mui-palette-AppBar-defaultBg)', py: 0.5, my: 1.5, borderRadius: 6 } }} />}
        </Box>
      </>}
      {showEmpty && <Box sx={{ display: 'flex', flexDirection: "column", alignItems: "center", my: 5, gap: 2 }}>
        <Pageview sx={{ width: 64, height: 64, fontSize: 64 }} />
        <Typography variant="overline" component="p">No documents found</Typography>
      </Box>}
    </Box>
  );
}

export default UserDocuments;