import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import DocumentCard from "./DocumentCard";
import Button from "@mui/material/Button";
import React from "react";
import { useNavigate } from "react-router-dom";
import { actions } from "../slices";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import NewIcon from '@mui/icons-material/AddCircle';
import { Link as RouterLink } from 'react-router-dom';

const Documents: React.FC = () => {
  const documents = useSelector((state: RootState) => state.app.documents);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

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
      loadFromBlob(files[0]);
    }
  }

  function loadFromBlob(blob: Blob) {
    const file = blob;
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      const content = reader.result as string;
      try {
        const document = JSON.parse(content);
        if (document.id) {
          window.localStorage.setItem(document.id, JSON.stringify(document));
          dispatch(actions.app.loadDocument(document));
          navigate(`/edit/${document.id}`);
        } else {
          dispatch(actions.app.announce({ message: "Invalid document data" }));
        }
      } catch (error) {
        dispatch(actions.app.announce({ message: "Invalid document data" }));
      }
    };
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
          <input type="file" hidden accept=".json" onChange={handleFilesChange} />
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
