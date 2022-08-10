import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useParams } from "react-router-dom";
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
import { useEffect } from "react";
import SplashScreen from "./SplachScreen";
import { SerializedEditorState } from "lexical";
import Grid from "@mui/material/Grid";
import templates from "../templates";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const NewDocument: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [tempelateKey, setTempelateKey] = React.useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      (async () => {
        const { payload } = await dispatch(actions.app.getDocumentAsync(params.id!));
        if (!payload) return;

        try {
          const document = payload;
          document.id = uuidv4();
          document.createdAt = Date.now();
          document.updatedAt = document.createdAt;
          dispatch(actions.app.loadDocument(document));
          navigate(`/edit/${document.id}`);
        } catch (error) {
          dispatch(actions.app.announce({ message: "Invalid document data" }));
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);


  const blankTempelate = (name?: string): SerializedEditorState => {
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
              }
            ]
          },
          {
            type: 'paragraph',
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
    const document: EditorDocument = {
      id: uuidv4(),
      name: documentName,
      data: tempelateKey ? templates[tempelateKey].data : blankTempelate(documentName),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>
        <Typography component="h1" variant="h5">Create a new document</Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField margin="normal" size="small" required fullWidth id="fileName" label="Document Name" name="fileName" autoComplete="fileName" autoFocus />
          <Accordion variant="outlined" sx={{ my: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 38, '.MuiAccordionSummary-content': { my: 0 } }}>
              <Typography>Templates</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Button fullWidth variant="outlined" sx={{
                    p: 1,
                    color: tempelateKey === null ? 'success.main' : 'primary.main',
                    borderColor: tempelateKey === null ? 'success.main' : 'primary.main',
                  }}
                    onClick={() => setTempelateKey(null)}>
                    Blank
                  </Button>
                </Grid>
                {Object.keys(templates).map(key => <Grid item key={key} xs={12}>
                  <Button fullWidth variant="outlined" sx={{
                    p: 1,
                    color: tempelateKey === key ? 'success.main' : 'primary.main',
                    borderColor: tempelateKey === key ? 'success.main' : 'primary.main',
                  }}
                    onClick={() => setTempelateKey(key)}>
                    {templates[key].name}
                  </Button>
                </Grid>)}
              </Grid>
            </AccordionDetails>
          </Accordion>
          <Button type="submit" fullWidth variant="contained" startIcon={<AddIcon />} sx={{ my: 2 }}>Create</Button>
        </Box>
      </Box>
    </Container>
  );
}

export default NewDocument;