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
import NewIcon from '@mui/icons-material/AddCircle';
import StorageIcon from '@mui/icons-material/Storage';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { EditorDocument } from "../slices/app";
import { validate } from "uuid";

import templates from "../templates";
import TemplateCard from "./TemplateCard";
import PlaygroundCard from "./PlaygroundCard";
import CloudDocumentCard from "./CloudDocumentCard";
import UserCard from "./UserCard";

const Documents: React.FC = () => {
  const documents = useSelector((state: RootState) => state.app.documents);
  const user = useSelector((state: RootState) => state.app.user);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

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
      <Box sx={{ textAlign: 'center', my: 3 }}>
        <Typography variant="h6" component="h2" sx={{ textAlign: 'center', my: 2 }}>
          Create a new document
        </Typography>
        <Button sx={{ mx: 1 }} variant="outlined" startIcon={<NewIcon />} component={RouterLink} to="/new">
          Blank
        </Button>
        <Button sx={{ mx: 1 }} variant="outlined" startIcon={<UploadFileIcon />} component="label">
          Upload
          <input type="file" hidden accept=".me" multiple onChange={e => handleFilesChange(e.target.files)} />
        </Button>
      </Box>
      <Box sx={{ my: 3 }}>
        <Typography variant="h6" component="h2" sx={{ my: 2 }}>
          Get started with a template
        </Typography>
        <Grid container spacing={2}>
          {Object.keys(templates).map(key => <Grid item key={key} xs={12} sm={6} md={4}>
            <TemplateCard template={templates[key]} />
          </Grid>)}
        </Grid>
      </Box>
      <Box sx={{ my: 3 }}>
        <Box sx={{ display: "flex", justifyContent: 'space-between', my: 2 }}>
          <Typography variant="h6" component="h2">
            Load from storage
          </Typography>
          <Button variant="outlined" startIcon={<StorageIcon />} onClick={backup}>
            Backup
          </Button>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12}><PlaygroundCard /></Grid>
          {documents.map(document => <Grid item key={document.id} xs={12} sm={6} md={4}>
            <DocumentCard document={document} />
          </Grid>)}
        </Grid>
      </Box>
      <Box sx={{ my: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', my: 2 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Load from cloud
          </Typography>
          <UserCard user={user} />
        </Box>
        {user && <Grid container spacing={2}>
          {user.documents.filter(d => !Object.keys({ ...localStorage }).includes(d.id)).map((document) =>
            <Grid item key={document.id} xs={12} sm={6} md={4}>
              <CloudDocumentCard document={document} />
            </Grid>
          )}
        </Grid>}
      </Box>
    </>
  )
}

export default Documents;
