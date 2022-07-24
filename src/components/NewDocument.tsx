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
import { useDispatch, useSelector } from "react-redux";
import { actions } from "../slices";
import { AppDispatch, RootState } from "../store";
import { useEffect } from "react";
import SplashScreen from "./SplachScreen";
import { SerializedEditorState } from "lexical";

const NewDocument: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const config = useSelector((state: RootState) => state.app.config);

  useEffect(() => {
    if (params.id) {
      (async () => {
        // const document = await Service.get(params.id!);
        // if (document) {
        //   try {
        //     document.id = uuidv4();
        //     document.timestamp = Date.now();
        //     window.localStorage.setItem(document.id, JSON.stringify(document));
        //     dispatch(actions.app.loadDocument(document));
        //     navigate(`/edit/${document.id}`);
        //   } catch (error) {
        //     dispatch(actions.app.announce({ message: "Invalid document data" }));
        //   }
        // } else {
        //   dispatch(actions.app.announce({ message: "No document with this id was found" }));
        // }
          dispatch(actions.app.announce({ message: "Document sharing via link feature is currently disabled!" }));
          setTimeout(() => { navigate('/open'); }, 3000);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);


  const newDocumentData = (name?: string): SerializedEditorState => {
    const editorState: any = {
      root: {
        type: "root",
        children: [
          {
            type: 'heading', "format": "center", "tag": "h2",
            children: [
              {
                type: 'text',
                text: name || 'New Document',
                mode: "normal",
              }
            ]
          }
        ],
      }
    };
    return editorState;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const documentName = formData.get("fileName") as string;
    const locationData = (location.state as { data: SerializedEditorState } | null )?.data;
    const document: EditorDocument = {
      id: uuidv4(),
      name: documentName,
      data: locationData ? locationData : newDocumentData(documentName),
      // timestamp: new Date().getTime(),
    }
    window.localStorage.setItem(document.id, JSON.stringify(document));
    navigate(`/edit/${document.id}`);
  };

  if (params.id) {
    return <SplashScreen title="Loading Document" />
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <ArticleIcon />
        </Avatar>
        <Typography component="h1" variant="h5">Create a new document</Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField margin="normal" size="small" required fullWidth id="fileName" label="Document Name" name="fileName" autoComplete="fileName" autoFocus />
          <Button type="submit" fullWidth variant="contained" startIcon={<AddIcon />} sx={{ mt: 3, mb: 2 }}>Create</Button>
        </Box>
      </Box>
    </Container>
  );
}

export default NewDocument;