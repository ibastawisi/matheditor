import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import DocumentCard from "./DocumentCard";
import Button from "@mui/material/Button";
import React from "react";
import { actions } from "../slices";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import NewIcon from '@mui/icons-material/AddCircle';
import { Link as RouterLink } from 'react-router-dom';
import { EditorDocument } from "../slices/app";
import { validate } from "uuid";

const Documents: React.FC = () => {
  const documents = useSelector((state: RootState) => state.app.documents);
  const dispatch = useDispatch<AppDispatch>();

  React.useEffect(() => {
    if ("launchQueue" in window && "LaunchParams" in window) {
      (window as any).launchQueue.setConsumer(
        async (launchParams: { files: any[] }) => {
          if (!launchParams.files.length) {
            return;
          }
          const fileHandle = launchParams.files[0];
          const blob: Blob = await fileHandle.getFile();
          loadFromBlob(blob);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => loadFromBlob(file));
    }
  }

  function loadFromBlob(blob: Blob) {
    const file = blob;
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      tryParseFile(reader.result as string);
    };
  }

  function tryParseFile(content: string) {
    try {
      const data: EditorDocument | { [key: string]: EditorDocument } = JSON.parse(content);
      if (validate((data as EditorDocument).id)) {
        addDocument(data as EditorDocument);
      } else {
        Object.values(data).forEach((document: EditorDocument) => {
          validate(document.id) && addDocument(document);
        });
      }
      // update app state
      dispatch(actions.app.load());
    } catch (error) {
      dispatch(actions.app.announce({ message: "Invalid document data" }));
    }
  }

  function addDocument(document: EditorDocument) {
    dispatch(actions.app.addDocument(document));
  }

  return (
    <Box>
      <Box sx={{ textAlign: 'center', my: 2 }}>
        <Typography variant="h6" component="h2" sx={{ my: 2 }}>
          Create a new document
        </Typography>
        <Button sx={{ mx: 1 }} variant="outlined" startIcon={<NewIcon />} component={RouterLink} to="/new">
          Create New
        </Button>
        <Button sx={{ mx: 1 }} variant="outlined" startIcon={<UploadFileIcon />} component="label">
          Upload File
          <input type="file" hidden accept=".json" multiple onChange={handleFilesChange} />
        </Button>
      </Box>
      <Box sx={{ mt: 5 }}>
        {documents.length > 0 && <>
          <Typography variant="h6" component="h2" sx={{ my: 2, textAlign: 'center' }}>
            Load from Local Storage
          </Typography>
          <Grid container spacing={2}>
            {documents.map(key => <Grid item key={key} xs={12} sm={6} md={4}>
              <DocumentCard document={JSON.parse(localStorage.getItem(key) || "")} />
            </Grid>)}
          </Grid>
        </>}
      </Box>
    </Box>
  )
}

export default Documents;
