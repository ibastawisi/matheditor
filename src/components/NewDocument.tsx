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
import { EditorDocument } from '../store/types';
import { useDispatch } from "react-redux";
import { actions } from "../store";
import { AppDispatch } from "../store";
import { SerializedEditorState } from "lexical/LexicalEditorState";
import { SerializedHeadingNode } from "@lexical/rich-text";
import { SerializedParagraphNode, SerializedRootNode, SerializedTextNode } from "lexical";
import documentDB from "../db";

const NewDocument: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const location = useLocation();

  const getData = async (name: string) => {
    if (params.id) {
      const locationData = (location.state as { data: SerializedEditorState } | null)?.data;
      if (locationData) return locationData;
      const localData = await documentDB.getByID(params.id).then(doc => doc?.data);
      if (localData) return localData;
      const res = await dispatch(actions.app.getDocumentAsync(params.id));
      const cloudData = (res.payload as any).data;
      if (cloudData) return cloudData;
    } else {
      const headingText: SerializedTextNode = {
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: name,
        type: 'text',
        version: 1,
      }
      const heading: SerializedHeadingNode = {
        children: [headingText],
        direction: "ltr",
        format: "center",
        indent: 0,
        tag: "h2",
        type: "heading",
        version: 1,
      }
      const paragraph: SerializedParagraphNode = {
        children: [],
        direction: "ltr",
        format: 'left',
        indent: 0,
        type: "paragraph",
        version: 1,
      }
      const root: SerializedRootNode = {
        children: [heading, paragraph],
        direction: "ltr",
        type: "root",
        version: 1,
        format: 'left',
        indent: 0
      }
      return ({ root });
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
    documentDB.add(document);
    navigate(`/edit/${document.id}`);
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>
        <Typography component="h1" variant="h5">Create a {params.id ? "fork" : "new document"}</Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField margin="normal" size="small" label="Document Name" name="fileName" autoComplete="off" fullWidth autoFocus />
          <Button type="submit" fullWidth variant="contained" startIcon={<AddIcon />} sx={{ my: 2 }}>Create</Button>
        </Box>
      </Box>
    </Container>
  );
}

export default NewDocument;