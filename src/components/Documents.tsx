"use client"
import { useRouter } from 'next/navigation';
import RouterLink from 'next/link'
import { useDispatch, useSelector, actions, RootState } from '@/store';
import DocumentCard from "./DocumentCard";
import React, { memo, useEffect, useState } from "react";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import StorageIcon from '@mui/icons-material/Storage';
import { EditorDocument, UserDocument } from '@/types';
import { validate } from "uuid";
import UserCard from "./UserCard";
import PostAddIcon from '@mui/icons-material/PostAdd';
import ArticleIcon from '@mui/icons-material/Article';
import HelpIcon from '@mui/icons-material/Help';
import SortControl from "./SortControl";
import { SortOption } from "../hooks/useSort";
import documentDB from '@/indexeddb';
import { createSelector } from '@reduxjs/toolkit';
import { Box, Avatar, Button, Typography, Grid, Card, CardActionArea, CardHeader, Collapse, Pagination } from '@mui/material';

const Documents: React.FC = () => {
  const user = useSelector(state => state.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const initialized = useSelector(state => state.initialized);
  const selectDocuments = createSelector(
    [(state: RootState) => state.documents], (documents) => {
      return documents.reduce((acc, document) => {
        if (!acc.find(d => d.id === document.id)) acc.push(document);
        return acc;
      }, [] as UserDocument[]);
    });
  const documents = useSelector(selectDocuments);

  const [sortedDocuments, setSortedDocuments] = useState(documents);
  const documentSortOptions: SortOption<UserDocument>[] = [
    { label: 'Updated', value: 'updatedAt' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
  ];

  useEffect(() => {
    if ("launchQueue" in window && "LaunchParams" in window) {
      (window as any).launchQueue.setConsumer(
        async (launchParams: { files: FileSystemFileHandle[] }) => {
          if (!launchParams.files.length) return;
          const files = await Promise.all(launchParams.files.map(async file => file.getFile()));
          await handleFilesChange(files);
        },
      );
    }
  }, []);

  const handleFilesChange = async (files: FileList | File[] | null) => {
    if (!files?.length) return;
    if (files.length === 1) {
      await loadFromFile(files[0]);
    } else {
      Array.from(files).forEach(async file => await loadFromFile(file));
      dispatch(actions.loadLocalDocuments());
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
        addDocument(data as EditorDocument, true);
      } else {
        Object.values(data).forEach((document: EditorDocument) => {
          validate(document.id) && addDocument(document);
        });
      }
    } catch (error) {
      dispatch(actions.announce({ message: "Invalid document data" }));
    }
    return document;
  }

  function addDocument(document: EditorDocument, navigateTo?: boolean) {
    if (documents.find(d => d.variant === "local" && d.id === document.id)) {
      dispatch(actions.alert({
        title: "Document already exists",
        content: `Do you want to overwrite ${document.name}?`,
        action: `dispatch(actions.updateLocalDocument({id:"${document.id}",partial:${JSON.stringify(document)}})).then(() => {${navigateTo ? `navigate("/edit/${document.id}");` : ""}})`
      }))
    } else {
      dispatch(actions.createLocalDocument(document)).then(() => {
        navigateTo && navigate(`/edit/${document.id}`);
      });
    }
  }

  async function backup() {
    const documents = await documentDB.getAll();
    const blob = new Blob([JSON.stringify(documents)], { type: "text/json" });
    const link = window.document.createElement("a");

    const now = new Date();
    link.download = now.toISOString() + ".me";
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

    const evt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(evt);
    link.remove()
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: "column", alignItems: "center", my: 5 }}>
        <Avatar sx={{ my: 2, bgcolor: 'primary.main' }}><PostAddIcon /></Avatar>
        <Button variant="outlined" component={RouterLink} prefetch={false} href="/new">New document</Button>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: { xs: "space-around", sm: "space-between" }, alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="h6" component="h2" sx={{ display: { xs: 'none', sm: 'block' } }}>Documents</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "center", mb: 1 }}>
          <SortControl<UserDocument> data={documents} onSortChange={setSortedDocuments} sortOptions={documentSortOptions} initialSortDirection="desc" />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "center" }}>
            <Button variant="outlined" startIcon={<UploadFileIcon />} component="label">
              Import
              <input type="file" hidden accept=".me" multiple onChange={e => handleFilesChange(e.target.files)} />
            </Button>
            <Button variant="outlined" startIcon={<StorageIcon />} onClick={backup}>
              Backup
            </Button>
          </Box>
        </Box>
      </Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Card variant="outlined">
            <CardActionArea component={RouterLink} prefetch={false} href="/playground">
              <CardHeader title="Playground" avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>} />
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card variant="outlined">
            <CardActionArea component={RouterLink} prefetch={false} href="/tutorial">
              <CardHeader title="Tutorial" avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><HelpIcon /></Avatar>} />
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
      <Collapse timeout={1000} in={!(user && initialized)} unmountOnExit><Box sx={{ mb: 2 }}><UserCard user={user} /></Box></Collapse>
      <DocumentsGrid documents={sortedDocuments} initialized={initialized} />
    </>
  )
}

const DocumentsGrid: React.FC<{ documents: UserDocument[], initialized: boolean }> = memo(({ documents, initialized }) => {
  const pages = Math.ceil(documents.length / 12);
  const [page, setPage] = useState(1);
  const handlePageChange = (_: any, value: number) => setPage(value);
  const pageDocuments = documents.slice((page - 1) * 12, page * 12);
  return <Grid container spacing={2}>
    {!initialized && documents.length === 0 && Array.from({ length: 3 }).map((_, i) => <Grid item key={i} xs={12} sm={6} md={4}><DocumentCard /></Grid>)}
    {pageDocuments.map(document => <Grid item key={document.id} xs={12} sm={6} md={4}>
      <DocumentCard document={document} />
    </Grid>)}
    {pages > 1 && <Pagination count={pages} page={page} onChange={handlePageChange} sx={{ display: "flex", justifyContent: "center", mt: 3, width: "100%" }} />}
  </Grid>
});

export default Documents;
