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

const Documents: React.FC = () => {
  const documents = useSelector((state: RootState) => state.app.documents);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files) {
      const file = files[0];
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        const content = reader.result as string;
        try {
          // parse document from url
          const document = JSON.parse(content);
          if (document.id) {
            window.localStorage.setItem(document.id, JSON.stringify(document));
            dispatch(actions.app.loadDocument(document));
            navigate(`/edit/${document.id}`);
          }
        } catch (error) {
          dispatch(actions.app.announce({ message: "Invalid document data" }));
        }
      };
    }
  }
  return (
    <Box>
      <Typography variant="h6" component="h2" sx={{ my: 2 }}>
        Load from Local Storage
      </Typography>
      <Grid container spacing={2}>
        {documents.map(key => <Grid item key={key} xs={12} sm={6} md={4}>
          <DocumentCard document={JSON.parse(localStorage.getItem(key) || "")} />
        </Grid>)}
      </Grid>
      <Typography variant="h6" component="h2" sx={{ my: 2 }}>
        Load from File
      </Typography>
      <Button variant="outlined" startIcon={<UploadFileIcon />} component="label">
        Upload a file
        <input type="file" hidden accept=".json" onChange={handleFilesChange} />
      </Button>
    </Box>
  )
}

export default Documents;