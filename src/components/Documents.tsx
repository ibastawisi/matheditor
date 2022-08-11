import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import DocumentCard from "./DocumentCard";
import Button from "@mui/material/Button";
import React, { useEffect } from "react";
import { actions } from "../slices";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import StorageIcon from '@mui/icons-material/Storage';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { EditorDocument } from "../slices/app";
import { validate } from "uuid";

import PlaygroundCard from "./PlaygroundCard";
import UserCard from "./UserCard";
import Avatar from "@mui/material/Avatar";
import PostAddIcon from '@mui/icons-material/PostAdd';

const Documents: React.FC = () => {
  const documents = useSelector((state: RootState) => state.app.documents);
  const user = useSelector((state: RootState) => state.app.user);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const cloudDocuments = user?.documents.filter(d => !Object.keys({ ...localStorage }).includes(d.id));
  const sortByDate = (documents: Omit<EditorDocument, "data">[]) => [...documents].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

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
      const id = await loadFromFile(files[0]);
      id && navigate(`/edit/${id}`);
    } else {
      Array.from(files).forEach(async file => await loadFromFile(file));
      // update app state
      dispatch(actions.app.load());
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
        addDocument(data as EditorDocument);
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

  function addDocument(document: EditorDocument) {
    if (documents.find(d => d.id === document.id)) {
      dispatch(actions.app.announce({ message: "Updating existing document: " + document.name }));
      dispatch(actions.app.deleteDocument(document.id));
    }
    dispatch(actions.app.addDocument(document));
  }

  function backup() {
    const keys = Object.keys({ ...localStorage }).filter((key: string) => validate(key));
    const documents = keys.map(key => JSON.parse(localStorage.getItem(key) as string));
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
        <Box sx={{ display: "flex", justifyContent: 'space-between', my: 2 }}>
          <Typography variant="h6" component="h2">Recent</Typography>
          <Box>
            <Button sx={{ mr: 1 }} variant="outlined" startIcon={<UploadFileIcon />} component="label">
              Import
              <input type="file" hidden accept=".me" multiple onChange={e => handleFilesChange(e.target.files)} />
            </Button>
            <Button variant="outlined" startIcon={<StorageIcon />} onClick={backup}>
              Backup
            </Button>
          </Box>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12}><PlaygroundCard /></Grid>
          {sortByDate(documents).map(document => <Grid item key={document.id} xs={12} sm={6} md={4}>
            <DocumentCard document={document} variant="local" />
          </Grid>)}
        </Grid>
      </Box>
      <Box sx={{ my: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Cloud
          </Typography>
          {!user && <UserCard />}
        </Box>
        {user && <Grid container spacing={2}>
          {!cloudDocuments?.length &&
            <Grid item xs={12}>
              <Typography variant="overline" component="p" sx={{ textAlign: "center" }}>
                {!user.documents.length ? "No documents found" : "All documents are already synced"}
              </Typography>
            </Grid>}
          {cloudDocuments && sortByDate(cloudDocuments).map((document) =>
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
