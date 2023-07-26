"use client"
import { useRouter } from 'next/navigation';
import RouterLink from 'next/link'
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import DocumentCard from "./DocumentCard";
import Button from "@mui/material/Button";
import React, { memo, useEffect, useState } from "react";
import { actions } from "../store";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import StorageIcon from '@mui/icons-material/Storage';
import { EditorDocument, User, UserDocument } from '@/types';
import { validate } from "uuid";
import UserCard from "./UserCard";
import Avatar from "@mui/material/Avatar";
import PostAddIcon from '@mui/icons-material/PostAdd';
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardHeader from "@mui/material/CardHeader";
import ArticleIcon from '@mui/icons-material/Article';
import HelpIcon from '@mui/icons-material/Help';
import SortControl from "./SortControl";
import { SortOption } from "../hooks/useSort";
import Pagination from "@mui/material/Pagination";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReportIcon from '@mui/icons-material/Report';
import { useSession } from 'next-auth/react';
import documentDB from '@/indexeddb';

const Documents: React.FC = () => {
  const documents = useSelector((state: RootState) => state.documents);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const { status } = useSession();
  const user = useSelector((state: RootState) => state.user);
  const initialized = useSelector((state: RootState) => state.initialized);
  const localDocuments = documents.map(d => d.id);
  const cloudDocuments = user?.documents.filter(d => !localDocuments.includes(d.id)) || [];
  const allDocuments = [...documents, ...cloudDocuments];

  const [sortedDocuments, setSortedDocuments] = useState(allDocuments);
  const documentSortOptions: SortOption<UserDocument>[] = [
    { label: 'Updated', value: 'updatedAt' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
  ];
  const pages = Math.ceil(allDocuments.length / 12);
  const [page, setPage] = useState(1);
  const handlePageChange = (_: any, value: number) => setPage(value);

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
      dispatch(actions.loadDocumentsAsync());
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
    if (documents.find(d => d.id === document.id)) {
      dispatch(actions.alert({
        title: "Document already exists",
        content: `Do you want to overwrite ${document.name}?`,
        action: `dispatch(actions.deleteDocument("${document.id}"));
         dispatch(actions.addDocument(${JSON.stringify(document)}));
          ${navigateTo ? `navigate("/edit/${document.id}");` : ""}`
      }))
    } else {
      dispatch(actions.addDocument(document));
      navigateTo && navigate(`/edit/${document.id}`);
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
      <Box sx={{ my: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: { xs: "space-around", sm: "space-between" }, alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="h6" component="h2" sx={{ display: { xs: 'none', sm: 'block' } }}>Documents</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "center", mb: 1 }}>
            <SortControl<UserDocument> data={allDocuments} onSortChange={setSortedDocuments} sortOptions={documentSortOptions} initialSortDirection="desc" />
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
        {initialized && <DocumentsTree documents={sortedDocuments.slice((page - 1) * 12, page * 12)} localDocuments={localDocuments} />}
        {initialized && documents.length === 0 && <Grid item xs={12} sx={{ my: 2 }}><LocalDataMissing /></Grid>}
        {!user && <Grid item xs={12} sx={{ my: 2 }}><UserCard status={status} /></Grid>}
        {pages > 1 && <Pagination count={pages} page={page} onChange={handlePageChange} sx={{ display: "flex", justifyContent: "center", mt: 3 }} />}
      </Box>
    </>
  )
}

const DocumentsTree: React.FC<{ documents: UserDocument[], localDocuments: string[] }> = memo(({ documents, localDocuments }) => {
  return <Grid container spacing={2}>
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
    {documents.map(document => <Grid item key={document.id} xs={12} sm={6} md={4}>
      <DocumentCard document={document} variant={localDocuments.includes(document.id) ? "local" : "cloud"} />
    </Grid>)}
  </Grid>
});

const LocalDataMissing: React.FC = () => {
  return <Accordion disableGutters TransitionProps={{ mountOnEnter: true }} sx={{ my: 2 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <ReportIcon sx={{ color: 'error.main', mr: 1 }} />
      <Typography>{"Can't find your data?"}</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Typography variant="h5" sx={{ mb: 3, textAlign: "center" }}>
        matheditor.ml is now matheditor.me
      </Typography>
      <Typography gutterBottom>to recover your data, please follow the steps below:</Typography>
      <Typography variant="subtitle2" gutterBottom>
        <Button variant="outlined" startIcon={<StorageIcon />} size="small" sx={{ mr: 1 }}>
          Backup
        </Button> your data from the <a href="https://matheditor.ml">old domain</a>.
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        <Button variant="outlined" startIcon={<UploadFileIcon />} size="small" sx={{ mr: 1 }}>
          Import
        </Button> your data to the <a href="https://matheditor.me">new domain</a>.
      </Typography>
    </AccordionDetails>
  </Accordion>
}

export default Documents;
