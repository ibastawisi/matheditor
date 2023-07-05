/* eslint-disable react-hooks/exhaustive-deps */
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { useParams } from 'react-router-dom';
import UserCard from "./UserCard";
import { User, UserDocument } from "../slices/app";
import { getUser } from "../services";
import DocumentCard from "./DocumentCard";
import { SortOption } from "../hooks/useSort";
import { SortControl } from "./SortControl";

const User: React.FC = () => {
  const loggedInUser = useSelector((state: RootState) => state.app.user);
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

  return <Box>
    <Helmet><title>{user ? `${user.name}'s Profile` : "Profile"}</title></Helmet>
    <UserCard user={user} variant="public" />
    {user && <Box sx={{ gap: 1, my: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap-reverse", justifyContent: 'space-between', alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="h6" component="h2" sx={{ textAlign: "center" }}>Published Documents</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "center", mb: 1 }}>
          <SortControl<UserDocument> data={user.documents} onSortChange={setSortedDocuments} sortOptions={documentSortOptions} initialSortDirection="desc" />
        </Box>
      </Box>
      <Grid container spacing={2}>
        {!user?.documents?.length &&
          <Grid item xs={12}>
            <Typography variant="overline" component="p" sx={{ textAlign: "center" }}>
              No documents found
            </Typography>
          </Grid>}
        {sortedDocuments.map(document => <Grid item xs={12} sm={6} md={4} key={document.id}>
          <DocumentCard document={document} variant="public" />
        </Grid>)}
      </Grid>
    </Box>
    }
  </Box>;
}

export default User;