"use client"
import { useState, memo } from "react";
import { useSelector } from '@/store';
import UserCard from "./UserCard";
import { UserDocument } from '@/types';
import DocumentCard from "./DocumentCard";
import { SortOption } from "@/hooks/useSort";
import SortControl from "./SortControl";
import RouterLink from 'next/link';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Grid, Pagination, Typography } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

const Dashboard: React.FC = ({ }) => {
  const documents = useSelector(state => state.documents);
  const user = useSelector(state => state.user);

  return <Box>
    <UserCard user={user} />
    <Box sx={{ my: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Button component={RouterLink} prefetch={false} scroll={false} href={user?.role === "admin" ? "/admin" : "/dashboard"} sx={{ mx: "auto" }}>
        {user?.role === "admin" ? "Admin Dashboard" : "Dashboard"}
      </Button>
      <DocumentsGrid documents={documents.filter(d => d.variant === "local")} title="Local Documents" />
      <DocumentsGrid documents={documents.filter(d => d.variant === "cloud")} title="Cloud Documents" />
    </Box>
  </Box>;
}

export default Dashboard;

const DocumentsGrid: React.FC<{ documents: UserDocument[], title: string }> = memo(({ documents, title }) => {
  const [sortedDocuments, setSortedDocuments] = useState(documents);
  const documentSortOptions: SortOption<UserDocument>[] = [
    { label: 'Updated', value: 'updatedAt' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
  ];
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
        <SortControl<UserDocument> data={documents} onSortChange={setSortedDocuments} sortOptions={documentSortOptions} initialSortDirection="desc" />
      </Box>
      <DocumentsTree documents={sortedDocuments.slice((page - 1) * 12, page * 12)} />
      {pages > 1 && <Pagination count={pages} page={page} onChange={handlePageChange} sx={{ display: "flex", justifyContent: "center", mt: 3 }} />}
    </AccordionDetails>
  </Accordion>
});

const DocumentsTree: React.FC<{ documents: UserDocument[] }> = memo(({ documents }) => {
  return <Grid container spacing={2}>
    {documents.map(document => <Grid item xs={12} sm={6} md={4} key={document.id}>
      <DocumentCard document={document} />
    </Grid>)}
  </Grid>
});