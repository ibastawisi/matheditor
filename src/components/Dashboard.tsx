"use client"
import { useState, memo } from "react";
import { useSelector } from '@/store';
import UserCard from "./UserCard";
import { User, UserDocument } from '@/types';
import DocumentCard from "./DocumentCard";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Grid, Pagination, Typography } from "@mui/material";
import { ExpandMore, Pageview } from "@mui/icons-material";
import DocumentSortControl from "./DocumentSortControl";

const Dashboard: React.FC = () => {
  const documents = useSelector(state => state.documents);
  const user = useSelector(state => state.user);

  return <Box>
    <UserCard user={user} sessionUser={user} />
    <Box sx={{ my: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <DocumentsGrid documents={documents.filter(d => d.local)} title="Local Documents" user={user} />
      <DocumentsGrid documents={documents.filter(d => d.cloud && !d.local)} title="Cloud Documents" user={user} />
    </Box>
  </Box>;
}

export default Dashboard;

const DocumentsGrid: React.FC<{ documents: UserDocument[], title: string, user?: User }> = memo(({ documents, title, user }) => {
  const [sortedDocuments, setSortedDocuments] = useState(documents);
  const pages = Math.ceil(documents.length / 12);
  const [page, setPage] = useState(1);
  const handlePageChange = (_: any, value: number) => setPage(value);

  return <Accordion disableGutters TransitionProps={{ mountOnEnter: true }}>
    <AccordionSummary expandIcon={<ExpandMore />}>
      <Typography>{title}</Typography>
      <Typography sx={{ color: 'text.secondary', mx: 1 }}>({documents.length})</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ display: "flex", justifyContent: 'flex-end', alignItems: "center", gap: 1, my: 2 }}>
        <DocumentSortControl documents={documents} setDocuments={setSortedDocuments} />
      </Box>
      {!documents.length && <Box sx={{ display: 'flex', flexDirection: "column", alignItems: "center", my: 5, gap: 2 }}>
        <Pageview sx={{ width: 64, height: 64, fontSize: 64 }} />
        <Typography variant="overline" component="p">No documents found</Typography>
      </Box>}
      <DocumentsTree documents={sortedDocuments.slice((page - 1) * 12, page * 12)} user={user} />
      {pages > 1 && <Pagination count={pages} page={page} onChange={handlePageChange} sx={{ display: "flex", justifyContent: "center", mt: 3 }} />}
    </AccordionDetails>
  </Accordion>
});

const DocumentsTree: React.FC<{ documents: UserDocument[], user?: User }> = memo(({ documents, user }) => {
  return <Grid container spacing={2}>
    {documents.map(document => <Grid item xs={12} sm={6} md={4} key={document.id}>
      <DocumentCard userDocument={document} user={user} />
    </Grid>)}
  </Grid>
});