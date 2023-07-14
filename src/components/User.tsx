/* eslint-disable react-hooks/exhaustive-deps */
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useState, useEffect, memo } from "react";
import { Helmet } from "react-helmet";
import { useParams } from 'react-router-dom';
import UserCard from "./UserCard";
import { User, UserDocument } from '../types';
import { getUser } from "../services";
import DocumentCard from "./DocumentCard";
import { SortOption } from "../hooks/useSort";
import SortControl from "./SortControl";
import Pagination from "@mui/material/Pagination";

const User: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const params = useParams<{ id: string }>();

  useEffect(() => {
    const loadUser = async (id: string) => {
      const user = await getUser(id);
      setUser(user);
    }
    params.id && loadUser(params.id);

  }, []);

  const [sortedDocuments, setSortedDocuments] = useState(user?.documents || []);
  const documentSortOptions: SortOption<UserDocument>[] = [
    { label: 'Updated', value: 'updatedAt' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
  ];
  const pages = Math.ceil((user?.documents?.length ?? 0) / 12);
  const [page, setPage] = useState(1);
  const handlePageChange = (_: any, value: number) => setPage(value);

  return <Box>
    <Helmet><title>{user ? `${user.name}'s Profile` : "Profile"}</title></Helmet>
    <UserCard user={user} variant="public" />
    {user && <Box sx={{ gap: 1, my: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: 'space-between', alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="h6" component="h2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Published Documents</Typography>
        <SortControl<UserDocument> data={user.documents} onSortChange={setSortedDocuments} sortOptions={documentSortOptions} initialSortDirection="desc" />
      </Box>
      <PublicDocumentsTree documents={sortedDocuments.slice((page - 1) * 12, page * 12)} />
      {pages > 1 && <Pagination count={pages} page={page} onChange={handlePageChange} sx={{ display: "flex", justifyContent: "center", mt: 3 }} />}
      {!sortedDocuments.length && <Typography variant="overline" component="p" sx={{ my: 3, textAlign: "center" }}>
        No documents found
      </Typography>}
    </Box>
    }
  </Box>;
}

const PublicDocumentsTree: React.FC<{ documents: UserDocument[] }> = memo(({ documents }) => {
  return <Grid container spacing={2}>
    {documents.map(document => <Grid item xs={12} sm={6} md={4} key={document.id}>
      <DocumentCard document={document} variant="public" />
    </Grid>)}
  </Grid>
});

export default User;