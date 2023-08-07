"use client"
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useState, useEffect, memo } from "react";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector, actions } from '@/store';
import UserCard from "./UserCard";
import { DocumentVariant, UserDocument } from '@/types';
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DocumentCard from "./DocumentCard";
import { SortOption } from "@/hooks/useSort";
import SortControl from "./SortControl";
import Pagination from "@mui/material/Pagination";
import { useSession } from "next-auth/react";

const Dashboard: React.FC = ({ }) => {
  const dispatch = useDispatch();
  const documents = useSelector(state => state.documents);
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
      <DocumentsGrid documents={documents.filter(d => d.variant === "local")} title="Local Documents" variant="local" />
      <DocumentsGrid documents={documents.filter(d => d.variant === "cloud")} title="Cloud Documents" variant="cloud" />
    </Box>
  </Box>;
}

export default Dashboard;

const DocumentsGrid: React.FC<{ documents: UserDocument[], title: string, variant: DocumentVariant }> = memo(({ documents, title, variant }) => {
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
      <DocumentsTree documents={sortedDocuments.slice((page - 1) * 12, page * 12)} variant={variant} />
      {pages > 1 && <Pagination count={pages} page={page} onChange={handlePageChange} sx={{ display: "flex", justifyContent: "center", mt: 3 }} />}
    </AccordionDetails>
  </Accordion>
});

const DocumentsTree: React.FC<{ documents: UserDocument[], variant: DocumentVariant }> = memo(({ documents, variant }) => {
  return <Grid container spacing={2}>
    {documents.map(document => <Grid item xs={12} sm={6} md={4} key={document.id}>
      <DocumentCard document={document} variant={variant} />
    </Grid>)}
  </Grid>
});