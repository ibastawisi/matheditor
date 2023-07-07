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
import DocumentCard from "./DocumentCard";
import { SortOption } from "../hooks/useSort";
import SortControl from "./SortControl";

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
      <LocalDocumentsGrid documents={documents} />
      <CloudDocumentsGrid documents={user.documents} />
    </Box>}
    {user?.admin && admin && <Box sx={{ my: 3 }}>
      <AdminDocumentsGrid documents={admin.documents} />
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

  return <Accordion disableGutters TransitionProps={{ mountOnEnter: true }} sx={{ my: 2 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>Users</Typography>
      <Typography sx={{ color: 'text.secondary', mx: 1 }}>({users.length})</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ display: "flex", justifyContent: 'flex-end', alignItems: "center", gap: 1, my: 2 }}>
        <SortControl<User> data={users} onSortChange={setSortedUsers} sortOptions={usersortOptions} initialSortDirection="desc" />
      </Box>
      <UsersTree users={sortedUsers} />
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

const AdminDocumentsGrid: React.FC<{ documents: AdminDocument[] }> = memo(({ documents }) => {
  const [sortedDocuments, setSortedDocuments] = useState(documents);
  const documentSortOptions: SortOption<AdminDocument>[] = [
    { label: 'Updated', value: 'updatedAt' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
    { label: 'Author', value: 'author.name' },
  ];
  return <Accordion disableGutters TransitionProps={{ mountOnEnter: true }} sx={{ my: 2 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>Admin Documents</Typography>
      <Typography sx={{ color: 'text.secondary', mx: 1 }}>({documents.length})</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ display: "flex", justifyContent: 'flex-end', alignItems: "center", gap: 1, my: 2 }}>
        <SortControl<AdminDocument> data={documents} onSortChange={setSortedDocuments} sortOptions={documentSortOptions} initialSortDirection="desc" />
      </Box>
      <AdminDocumentsTree documents={sortedDocuments} />
    </AccordionDetails>
  </Accordion>
});

const AdminDocumentsTree: React.FC<{ documents: AdminDocument[] }> = memo(({ documents }) => {
  return <Grid container spacing={2}>
    {documents.map(document => <Grid item xs={12} sm={6} md={4} key={document.id}>
      <DocumentCard document={document} variant="admin" />
    </Grid>)}
  </Grid>
});

const CloudDocumentsGrid: React.FC<{ documents: UserDocument[] }> = memo(({ documents }) => {
  const [sortedDocuments, setSortedDocuments] = useState(documents);
  const documentSortOptions: SortOption<UserDocument>[] = [
    { label: 'Updated', value: 'updatedAt' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
  ];
  return <Accordion disableGutters TransitionProps={{ mountOnEnter: true }} sx={{ my: 2 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>Cloud Documents</Typography>
      <Typography sx={{ color: 'text.secondary', mx: 1 }}>({documents.length})</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ display: "flex", justifyContent: 'flex-end', alignItems: "center", gap: 1, my: 2 }}>
        <SortControl<UserDocument> data={documents} onSortChange={setSortedDocuments} sortOptions={documentSortOptions} initialSortDirection="desc" />
      </Box>
      <CloudDocumentsTree documents={sortedDocuments} />
    </AccordionDetails>
  </Accordion>
});

const CloudDocumentsTree: React.FC<{ documents: UserDocument[] }> = memo(({ documents }) => {
  return <Grid container spacing={2}>
    {documents.map(document => <Grid item xs={12} sm={6} md={4} key={document.id}>
      <DocumentCard document={document} variant="cloud" />
    </Grid>)}
  </Grid>
});

const LocalDocumentsGrid: React.FC<{ documents: UserDocument[] }> = memo(({ documents }) => {
  const [sortedDocuments, setSortedDocuments] = useState(documents);
  const documentSortOptions: SortOption<UserDocument>[] = [
    { label: 'Updated', value: 'updatedAt' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
  ];
  return <Accordion disableGutters TransitionProps={{ mountOnEnter: true }} sx={{ my: 2 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>Local Documents</Typography>
      <Typography sx={{ color: 'text.secondary', mx: 1 }}>({documents.length})</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ display: "flex", justifyContent: 'flex-end', alignItems: "center", gap: 1, my: 2 }}>
        <SortControl<UserDocument> data={documents} onSortChange={setSortedDocuments} sortOptions={documentSortOptions} initialSortDirection="desc" />
      </Box>
      <LocalDocumentsTree documents={sortedDocuments} />
    </AccordionDetails>
  </Accordion>
});

const LocalDocumentsTree: React.FC<{ documents: UserDocument[] }> = memo(({ documents }) => {
  return <Grid container spacing={2}>
    {documents.map(document => <Grid item xs={12} sm={6} md={4} key={document.id}>
      <DocumentCard document={document} variant="local" />
    </Grid>)}
  </Grid>
});