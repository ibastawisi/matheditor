"use client"
import { useState, memo } from "react";
import UserCard from "./UserCard";
import { User, UserDocument } from '@/types';
import DocumentCard from "./DocumentCard";
import { Box, Grid, Pagination, Typography } from "@mui/material";
import { Pageview } from "@mui/icons-material";
import DocumentSortControl from "./DocumentSortControl";

const User: React.FC<{ user?: User, sessionUser?: User, documents: UserDocument[] }> = ({ user, sessionUser, documents }) => {
  const [sort, setSort] = useState<{ key: string, direction: "asc" | "desc" }>({ key: 'updatedAt', direction: 'desc' });
  const [sortedDocuments, setSortedDocuments] = useState(documents || []);
  const pages = Math.ceil((documents?.length ?? 0) / 12);
  const [page, setPage] = useState(1);
  const handlePageChange = (_: any, value: number) => setPage(value);

  return <Box>
    <UserCard user={user} sessionUser={sessionUser} />
    {user && <Box sx={{ gap: 1, my: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: 'space-between', alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="h6" component="h2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Published Documents</Typography>
        <DocumentSortControl documents={documents} setDocuments={setSortedDocuments} value={sort} setValue={setSort} />
      </Box>
      <PublishedDocumentsTree documents={sortedDocuments.slice((page - 1) * 12, page * 12)} />
      {pages > 1 && <Pagination count={pages} page={page} onChange={handlePageChange} sx={{ display: "flex", justifyContent: "center", mt: 3 }} />}
      {!sortedDocuments.length && <Box sx={{ display: 'flex', flexDirection: "column", alignItems: "center", my: 5, gap: 2 }}>
        <Pageview sx={{ width: 64, height: 64, fontSize: 64 }} />
        <Typography variant="overline" component="p">No documents found</Typography>
      </Box>}
    </Box>
    }
  </Box>;
}

const PublishedDocumentsTree: React.FC<{ documents: UserDocument[], user?: User }> = memo(({ documents, user }) => {
  return <Grid container spacing={2}>
    {documents.map(document => <Grid item xs={12} sm={6} md={4} key={document.id}>
      <DocumentCard userDocument={document} user={user} />
    </Grid>)}
  </Grid>
});

export default User;