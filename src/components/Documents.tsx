import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import DocumentCard from "./DocumentCard";
import Button from "@mui/material/Button";
import React, { useEffect, useState } from "react";
import { actions } from "../slices";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import StorageIcon from '@mui/icons-material/Storage';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { EditorDocument, UserDocument } from "../slices/app";
import { validate } from "uuid";

import UserCard from "./UserCard";
import Avatar from "@mui/material/Avatar";
import PostAddIcon from '@mui/icons-material/PostAdd';
import documentDB from "../db";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardHeader from "@mui/material/CardHeader";
import ArticleIcon from '@mui/icons-material/Article';
import HelpIcon from '@mui/icons-material/Help';

const Documents: React.FC = () => {
  const documents = useSelector((state: RootState) => state.app.documents);
  const user = useSelector((state: RootState) => state.app.user);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const localDocuments = documents.map(d => d.id);
  const cloudDocuments = user?.documents.filter(d => !localDocuments.includes(d.id));

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

  useEffect(() => {
    if ("launchQueue" in window && "LaunchParams" in window) {
      (window as any).launchQueue.setConsumer(
        async (launchParams: { files: FileSystemFileHandle[] }) => {
          if (!launchParams.files.length) return;
          const files = await Promise.all(launchParams.files.map(async file => file.getFile()));
          await handleFilesChange(files);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilesChange = async (files: FileList | File[] | null) => {
    if (!files?.length) return;
    if (files.length === 1) {
      await loadFromFile(files[0]);
    } else {
      Array.from(files).forEach(async file => await loadFromFile(file));
      dispatch(actions.app.loadDocumentsAsync());
    }
  }

  async function loadFromFile(file: File): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        const documentId = tryParseFile(reader.result as string)?.id;
        resolve(documentId);
      };
    });
  }

  function tryParseFile(content: string): EditorDocument | null {
    let document: EditorDocument | null = null;
    try {
      const data: EditorDocument | { [key: string]: EditorDocument } = JSON.parse(content);
      if (validate((data as EditorDocument).id)) {
        document = data as EditorDocument;
        addDocument(data as EditorDocument, true);
      } else {
        Object.values(data).forEach((document: EditorDocument) => {
          validate(document.id) && addDocument(document);
        });
      }
    } catch (error) {
      dispatch(actions.app.announce({ message: "Invalid document data" }));
    }
    return document;
  }

  function addDocument(document: EditorDocument, navigateTo?: boolean) {
    if (documents.find(d => d.id === document.id)) {
      dispatch(actions.app.alert({
        title: "Document already exists",
        content: `Do you want to overwrite ${document.name}?`,
        action: `dispatch(actions.app.deleteDocument("${document.id}"));
         dispatch(actions.app.addDocument(${JSON.stringify(document)}));
          ${navigateTo ? `navigate("/edit/${document.id}");` : ""}`
      }))
    } else {
      dispatch(actions.app.addDocument(document));
      navigateTo && navigate(`/edit/${document.id}`);
    }
  }

  async function backup() {
    const documents = await documentDB.getAll();
    const blob = new Blob([JSON.stringify(documents)], { type: "text/json" });
    const link = window.document.createElement("a");

    const now = new Date();
    link.download = now.toISOString() + ".me";
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

    const evt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(evt);
    link.remove()
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: "column", alignItems: "center", my: 5 }}>
        <Avatar sx={{ my: 2, bgcolor: 'primary.main' }}><PostAddIcon /></Avatar>
        <Button variant="outlined" component={RouterLink} to="/new">New document</Button>
      </Box>
      <Box sx={{ my: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap-reverse", justifyContent: 'space-between', alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>Recent</Typography>
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
            <Button variant="outlined" startIcon={<UploadFileIcon />} component="label">
              Import
              <input type="file" hidden accept=".me" multiple onChange={e => handleFilesChange(e.target.files)} />
            </Button>
            <Button variant="outlined" startIcon={<StorageIcon />} onClick={backup}>
              Backup
            </Button>
          </Box>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card variant="outlined">
              <CardActionArea component={RouterLink} to="/playground">
                <CardHeader title="Playground" avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>} />
              </CardActionArea>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card variant="outlined">
              <CardActionArea component={RouterLink} to="/tutorial">
                <CardHeader title="Tutorial" avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><HelpIcon /></Avatar>} />
              </CardActionArea>
            </Card>
          </Grid>
          {sortDocuments(documents).map(document => <Grid item key={document.id} xs={12} sm={6} md={4}>
            <DocumentCard document={document} variant="local" />
          </Grid>)}
        </Grid>
      </Box>
      <Box sx={{ my: 2 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          Cloud
        </Typography>
        {!user && <UserCard />}
        {user && <Grid container spacing={2}>
          {!cloudDocuments?.length &&
            <Grid item xs={12}>
              <Typography variant="overline" component="p" sx={{ textAlign: "center" }}>
                {!user.documents.length ? "No documents found" : "All documents are already synced"}
              </Typography>
            </Grid>}
          {cloudDocuments && sortDocuments(cloudDocuments).map((document) =>
            <Grid item key={document.id} xs={12} sm={6} md={4}>
              <DocumentCard document={document} variant="cloud" />
            </Grid>
          )}
        </Grid>}
      </Box>
    </>
  )
}

export default Documents;
