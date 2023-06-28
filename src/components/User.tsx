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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import Paper from "@mui/material/Paper";
import { getUser } from "../services";
import DocumentCard from "./DocumentCard";

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


  const [sort, setSort] = useState('updated-desc');
  const handleSortChange = (event: SelectChangeEvent) => {
    const value = event.target.value as string;
    setSort(value);
  };

  const sortDocuments = (documents: UserDocument[]) => {
    const sortBy = sort.split('-')[0];
    const sortDirection = sort.split('-')[1];
    switch (sortBy) {
      case "updated":
        return sortDirection === 'asc' ?
          [...documents].sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt)) :
          [...documents].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
      case "created":
        return sortDirection === 'asc' ?
          [...documents].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)) :
          [...documents].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      case "name":
        return sortDirection === 'asc' ?
          [...documents].sort((a, b) => a.name.localeCompare(b.name)) :
          [...documents].sort((a, b) => b.name.localeCompare(a.name));
      default:
        return documents;
    }
  }

  return <Box>
    <Helmet><title>{user ? `${user.name}'s Profile` : "Profile"}</title></Helmet>
    <UserCard user={user} hideControls={!loggedInUser || !user || loggedInUser.id !== user.id} />
    {user && <Box sx={{ gap: 1, my: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap-reverse", justifyContent: 'space-between', alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="h6" component="h2" sx={{ textAlign: "center" }}>Published Documents</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "center", mb: 1 }}>
          <FormControl size="small">
            <InputLabel id="sort-select-label">Sort</InputLabel>
            <Select
              labelId="sort-select-label"
              id="sort-select"
              value={sort}
              label="Sort"
              onChange={handleSortChange}
              sx={{
                '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0.5 },
                '& .MuiListItemIcon-root': { minWidth: 30 },
              }}
            >
              <MenuItem value="updated-desc">
                <ListItemIcon>
                  <ArrowDownwardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Updated</ListItemText>
              </MenuItem>
              <MenuItem value="updated-asc">
                <ListItemIcon>
                  <ArrowUpwardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Updated</ListItemText>
              </MenuItem>
              <MenuItem value="created-desc">
                <ListItemIcon>
                  <ArrowDownwardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Created</ListItemText>
              </MenuItem>
              <MenuItem value="created-asc">
                <ListItemIcon>
                  <ArrowUpwardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Created</ListItemText>
              </MenuItem>
              <MenuItem value="name-asc">
                <ListItemIcon>
                  <ArrowDownwardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Name</ListItemText>
              </MenuItem>
              <MenuItem value="name-desc">
                <ListItemIcon>
                  <ArrowUpwardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Name</ListItemText>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      <Grid container spacing={2}>
        {!user?.documents?.length &&
          <Grid item xs={12}>
            <Typography variant="overline" component="p" sx={{ textAlign: "center" }}>
              No documents found
            </Typography>
          </Grid>}
        {sortDocuments(user.documents).map(document => <Grid item xs={12} sm={6} md={4} key={document.id}>
          <DocumentCard document={document} variant="public" />
        </Grid>)}
      </Grid>
    </Box>
    }
  </Box>;
}

export default User;