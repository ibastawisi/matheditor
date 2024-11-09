"use client"
import { useState } from "react";
import type { User as UserDocuments, UserDocument } from '@/types';
import DocumentCard from "../DocumentCard";
import Grid from '@mui/material/Grid2';
import { Box, Pagination, Typography } from "@mui/material";
import { Pageview } from "@mui/icons-material";
import DocumentSortControl, { sortDocuments } from "../DocumentSortControl";

const UserDocuments: React.FC<{ documents?: UserDocument[] }> = ({ documents }) => {
  const [sort, setSort] = useState<{ key: string, direction: "asc" | "desc" }>({ key: 'updatedAt', direction: 'desc' });
  const showLoading = !documents;
  const showEmpty = !showLoading && !documents.length;
  const pageSize = 12;
  const pages = Math.ceil((documents?.length ?? 0) / pageSize);
  const [page, setPage] = useState(1);
  const handlePageChange = (_: any, value: number) => setPage(value);
  const sortedDocuments = sortDocuments(documents ?? [], sort);
  const pageDocuments = sortedDocuments.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Box sx={{ display: 'flex', flexDirection: "column", flex: 1 }}>
      {!showLoading && !showEmpty && <>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: 'space-between', alignItems: "center", gap: 1, minHeight: 40, position: "sticky", top: { 'xs': 55.99, 'sm': 63.99 }, backgroundColor: 'var(--mui-palette-background-default)', zIndex: 2, py: 1 }}>
          <Typography variant="h6" component="h2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Published Documents</Typography>
          <DocumentSortControl value={sort} setValue={setSort} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: "column", flex: 1, justifyContent: 'space-between' }}>
          <Grid container spacing={2}>
            {pageDocuments.map(document => <Grid key={document.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <DocumentCard userDocument={document} />
            </Grid>)}
          </Grid>
          {pages > 1 && <Pagination count={pages} page={page} onChange={handlePageChange} sx={{ display: "flex", justifyContent: "center", width: "100%", position: "sticky", bottom: 0, zIndex: 2, '& .MuiPagination-ul': { backgroundColor: 'var(--mui-palette-AppBar-defaultBg)', p: 1, my: 1.5, borderRadius: 6 } }} />}
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