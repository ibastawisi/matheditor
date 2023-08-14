"use client"
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useState, useEffect, memo } from "react";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector, actions, RootState } from '@/store';
import UserCard from "./UserCard";
import { UserDocument } from '@/types';
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DocumentCard from "./DocumentCard";
import { SortOption } from "@/hooks/useSort";
import SortControl from "./SortControl";
import Pagination from "@mui/material/Pagination";
import { useSession } from "next-auth/react";
import { createSelector } from "@reduxjs/toolkit";

const Dashboard: React.FC = ({ }) => {
  const dispatch = useDispatch();
  const selectDocuments = createSelector(
    [(state: RootState) => state.documents], (documents) => {
      return documents.reduce((acc, document) => {
        if (!acc.find(d => d.id === document.id)) acc.push(document);
        return acc;
      }, [] as UserDocument[]);
    });
  const documents = useSelector(selectDocuments);
  const user = useSelector(state => state.user);
  const initialized = useSelector(state => state.initialized);
  const { status } = useSession();

  useEffect(() => {
    if (!initialized) {
      dispatch(actions.load());
    }
  }, []);

  return <Box>
    <Helmet title="Dashboard" />
    <UserCard user={user} status={status} />
    <Box sx={{ my: 2 }}>
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

  return <Accordion disableGutters sx={{ my: 2 }} TransitionProps={{ mountOnEnter: true }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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