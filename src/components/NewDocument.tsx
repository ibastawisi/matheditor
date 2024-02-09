"use client"
import { usePathname, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from "uuid";
import * as React from 'react';
import { EditorDocument, UserDocument } from '@/types';
import { SerializedHeadingNode, SerializedParagraphNode, SerializedRootNode, SerializedTextNode } from "@/editor/types";
import { useEffect, useState } from 'react';
import { useDispatch, actions } from '@/store';
import DocumentCard from './DocumentCard';
import { Container, Box, Avatar, Typography, TextField, Button } from '@mui/material';
import { Article, Add } from '@mui/icons-material';

const NewDocument: React.FC = () => {
  const [base, setBase] = useState<UserDocument>();
  const [data, setData] = useState<EditorDocument["data"]>();
  const dispatch = useDispatch();
  const pathname = usePathname();
  const id = pathname.split('/')[2]?.toLowerCase();

  useEffect(() => {
    const loadDocument = async (id: string) => {
      const localResponse = await dispatch(actions.getLocalDocument(id));
      if (localResponse.type === actions.getLocalDocument.fulfilled.type) {
        const editorDocument = localResponse.payload as ReturnType<typeof actions.getLocalDocument.fulfilled>["payload"];
        const { data, ...rest } = editorDocument;
        const localDocument = { ...rest, revisions: [] };
        setBase({ id: editorDocument.id, local: localDocument });
        setData(data);
      } else {
        const cloudResponse = await dispatch(actions.forkCloudDocument(id));
        if (cloudResponse.type === actions.forkCloudDocument.fulfilled.type) {
          const { data, ...userDocument } = cloudResponse.payload as ReturnType<typeof actions.forkCloudDocument.fulfilled>["payload"];
          setBase(userDocument);
          setData(data);
        }
      }
    }
    id && loadDocument(id);
  }, []);

  const router = useRouter();
  const navigate = (path: string) => router.push(path, { scroll: false });

  const getData = async (name: string) => {
    if (data) return data;
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
    const newDocument: EditorDocument = { id: uuidv4(), name, head: uuidv4(), data, createdAt, updatedAt: createdAt };
    if (base) newDocument.baseId = base.id;
    const response = await dispatch(actions.createLocalDocument(newDocument))
    if (response.type === actions.createLocalDocument.fulfilled.type) {
      const href = `/edit/${newDocument.id}`;
      navigate(href);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ my: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}><Article /></Avatar>
        <Typography component="h1" variant="h5">{id ? "Fork a document" : "Create a new document"}</Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField id="document-name" margin="normal" size="small" label="Document Name" name="documentName" autoComplete="off" fullWidth autoFocus sx={{ '& .MuiInputBase-root': { height: 40 } }} />
          <Button type="submit" disabled={!!(id && !base)} fullWidth variant="contained" startIcon={<Add />} sx={{ my: 2 }}>Create</Button>
        </Box>
        {id && <Typography variant="overline" sx={{ color: 'text.secondary', my: 2 }}>Based on</Typography>}
        {id && <DocumentCard userDocument={base} sx={{ width: 320 }} />}
      </Box>
    </Container>
  );
}

export default NewDocument;