"use client"
import { useRouter } from 'next/navigation';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { v4 as uuidv4 } from "uuid";
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import ArticleIcon from '@mui/icons-material/Article';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { EditorDocument } from '@/types';
import { SerializedHeadingNode, SerializedParagraphNode, SerializedRootNode, SerializedTextNode } from "@/editor/types";
import { useEffect, useState } from 'react';
import useIndexedDBStore from '@/hooks/useIndexedDB';

const NewDocument: React.FC<{ params?: { id?: string }, cloudDocument?: EditorDocument }> = ({ params, cloudDocument }) => {
  const [document, setDocument] = useState(cloudDocument);
  const documentDB = useIndexedDBStore<EditorDocument>('documents');

  useEffect(() => {
    const loadDocument = async (id: string) => {
      const locaalDocument = await documentDB.getByID(id);
      if (locaalDocument) {
        setDocument(locaalDocument);
      } else if (cloudDocument) {
        setDocument(cloudDocument);
        documentDB.add(cloudDocument).catch((e) => console.error(e));
      }
    }
    params?.id && loadDocument(params.id);

  }, []);

  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  const getData = async (name: string) => {
    if (document) return document.data;
    else {
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
    const name = formData.get("documentName") as string || 'Untitled Document';
    const data = await getData(name);
    const createdAt = new Date().toISOString();
    if (!data) return;
    const document: EditorDocument = { id: uuidv4(), name, data, createdAt, updatedAt: createdAt, baseId: params?.id };
    documentDB.add(document);
    navigate(`/edit/${document.id}`);
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>
        <Typography component="h1" variant="h5">{document ? `Fork ${document.name}` : "Create a new document"}</Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField id="document-name" margin="normal" size="small" label="Document Name" name="documentName" autoComplete="off" fullWidth autoFocus sx={{ '& input': { height: 40 } }} />
          <Button type="submit" fullWidth variant="contained" startIcon={<AddIcon />} sx={{ my: 2 }}>Create</Button>
        </Box>
      </Box>
    </Container>
  );
}

export default NewDocument;