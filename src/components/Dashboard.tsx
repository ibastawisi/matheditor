/* eslint-disable react-hooks/exhaustive-deps */
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useState, useEffect, memo } from "react";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import UserCard from "./UserCard";
import { AdminDocument, User, UserDocument } from '../store/types';
import useLocalStorage from "../hooks/useLocalStorage";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { actions } from "../store";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DocumentCard, { DocumentCardVariant } from "./DocumentCard";
import { SortOption } from "../hooks/useSort";
import SortControl from "./SortControl";
import Pagination from "@mui/material/Pagination";

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.app.user);
  const documents = useSelector((state: RootState) => state.app.documents);
  const admin = useSelector((state: RootState) => state.app.admin);
  const [config, setConfig] = useLocalStorage('config', { debug: false });

  useEffect(() => {
    if (!user?.admin) return;
    !admin && dispatch(actions.app.loadAdminAsync());
  }, [user]);

  return <Box>
    <Helmet><title>Dashboard</title></Helmet>
    <UserCard user={user} />
    <Box sx={{ mt: 2 }}>
      <FormControlLabel control={<Switch checked={config.debug} onChange={e => setConfig({ ...config, debug: e.target.checked })} />} label="Show Editor Debug View" />
    </Box>
    {user && <Box sx={{ my: 2 }}>
      <DocumentsGrid documents={documents} title="Local Documents" variant="local" />
      <DocumentsGrid documents={user.documents} title="Cloud Documents" variant="cloud" />
      <DocumentsGrid documents={user.documents.filter(d => d.isPublic)} title="Public Documents" variant="public" />
    </Box>}
    {user?.admin && admin && <Box sx={{ my: 3 }}>
      <DocumentsGrid documents={admin.documents} title="Admin Documents" variant="admin" />
      <UserGrid users={admin.users} />
    </Box>}
  </Box>;
}

export default Dashboard;

const UserGrid: React.FC<{ users: User[] }> = memo(({ users }) => {
  const [sortedUsers, setSortedUsers] = useState(users);
  const usersortOptions: SortOption<User>[] = [
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
    { label: 'Documents', value: 'documents' },
  ];
  const pages = Math.ceil(users.length / 12);
  const [page, setPage] = useState(1);
  const handlePageChange = (_: any, value: number) => setPage(value);

  return <Accordion disableGutters TransitionProps={{ mountOnEnter: true }} sx={{ my: 2 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>Users</Typography>
      <Typography sx={{ color: 'text.secondary', mx: 1 }}>({users.length})</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ display: "flex", justifyContent: 'flex-end', alignItems: "center", gap: 1, my: 2 }}>
        <SortControl<User> data={users} onSortChange={setSortedUsers} sortOptions={usersortOptions} initialSortDirection="desc" />
      </Box>
      <UsersTree users={sortedUsers.slice((page - 1) * 12, page * 12)} />
      {pages > 1 && <Pagination count={pages} page={page} onChange={handlePageChange} sx={{ display: "flex", justifyContent: "center", mt: 3 }} />}
    </AccordionDetails>
  </Accordion>
});

const DocumentsGrid: React.FC<{ documents: UserDocument[], title: string, variant: DocumentCardVariant }> = memo(({ documents, title, variant }) => {
  const [sortedDocuments, setSortedDocuments] = useState(documents);
  const documentSortOptions: SortOption<UserDocument>[]  = [
    { label: 'Updated', value: 'updatedAt' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
  ];
  const isAdminDocuments = variant === 'admin';
  if (isAdminDocuments) (documentSortOptions as any).push({ label: 'Author', value: 'author.name' });
  const pages = Math.ceil(documents.length / 12);
  const [page, setPage] = useState(1);
  const handlePageChange = (_: any, value: number) => setPage(value);

  return <Accordion disableGutters TransitionProps={{ mountOnEnter: true }} sx={{ my: 2 }}>
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

const UsersTree: React.FC<{ users: User[] }> = memo(({ users }) => {
  return <Grid container spacing={2}>
    {users.map(user => <Grid item xs={12} sm={6} md={4} key={user.id}>
      <UserCard user={user} variant="admin" />
    </Grid>)}
  </Grid>
});

const DocumentsTree: React.FC<{ documents: UserDocument[], variant: 'local' | 'cloud' | 'public' | 'admin' }> = memo(({ documents, variant }) => {
  return <Grid container spacing={2}>
    {documents.map(document => <Grid item xs={12} sm={6} md={4} key={document.id}>
      <DocumentCard document={document} variant={variant} />
    </Grid>)}
  </Grid>
});