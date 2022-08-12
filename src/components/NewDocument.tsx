import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { v4 as uuidv4 } from "uuid";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import ArticleIcon from '@mui/icons-material/Article';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { EditorDocument } from "../slices/app";
import { useDispatch } from "react-redux";
import { actions } from "../slices";
import { AppDispatch } from "../store";
import { SerializedEditorState } from "lexical/LexicalEditorState";

const NewDocument: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const location = useLocation();

  const getData = async (name: string) => {
    if (params.id) {
      const locationData = (location.state as { data: SerializedEditorState } | null)?.data;
      if (locationData) return locationData;
      const localData = JSON.parse(window.localStorage.getItem(params.id) || '{}').data;
      if (localData) return localData;
      const { payload } = await dispatch(actions.app.getDocumentAsync(params.id));
      const cloudData = payload.data;
      if (cloudData) return cloudData;
    } else {
      const newData = { root: { type: "root", children: [{ type: 'heading', "format": "center", "tag": "h2", children: [{ type: 'text', text: name }] }, { type: 'paragraph' }] } };
      return newData;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("fileName") as string || 'Untitled Document';
    const data = await getData(name);
    const createdAt = new Date().toISOString();
    if (!data) return;
    const document: EditorDocument = { id: uuidv4(), name, data, createdAt, updatedAt: createdAt };
    window.localStorage.setItem(document.id, JSON.stringify(document));
    navigate(`/edit/${document.id}`);
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>
        <Typography component="h1" variant="h5">Create a new document</Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField margin="normal" size="small" label="Document Name" name="fileName" autoComplete="off" fullWidth autoFocus />
          <Button type="submit" fullWidth variant="contained" startIcon={<AddIcon />} sx={{ my: 2 }}>Create</Button>
        </Box>
      </Box>
    </Container>
  );
}

export default NewDocument;