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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { EditorDocument } from "../slices/app";
import { validate } from "uuid";

const Documents: React.FC = () => {
  const documents = useSelector((state: RootState) => state.app.documents);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  React.useEffect(() => {
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
          <input type="file" hidden accept=".json" multiple onChange={e => handleFilesChange(e.target.files)} />
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
