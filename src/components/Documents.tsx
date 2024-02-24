"use client"
import { useRouter } from 'next/navigation';
import RouterLink from 'next/link'
import { useDispatch, useSelector, actions } from '@/store';
import DocumentCard from "./DocumentCard";
import { memo, useEffect } from "react";
import { BackupDocument, EditorDocument, User, UserDocument } from '@/types';
import { validate } from "uuid";
import UserCard from "./UserCard";
import documentDB, { revisionDB } from '@/indexeddb';
import { Box, Avatar, Button, Typography, Grid, Card, CardActionArea, CardHeader, Collapse, Pagination } from '@mui/material';
import { PostAdd, UploadFile, Help, Storage, Science, Pageview } from '@mui/icons-material';
import DocumentSortControl, { sortDocuments } from './DocumentSortControl';
import DocumentFilterControl, { filterDocuments } from './DocumentFilterControl';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import FeedAd from './Ads/FeedAdd';

const IS_VERCEL = !!process.env.NEXT_PUBLIC_VERCEL_URL;

const Documents: React.FC = () => {
  const user = useSelector(state => state.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const initialized = useSelector(state => state.ui.initialized);
  const documents = useSelector(state => state.documents);
  const isOnline = useOnlineStatus();
  const showAds = IS_VERCEL && isOnline && !!user;

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
    Array.from(files).forEach(file => loadFromFile(file, files.length === 1));
    dispatch(actions.loadLocalDocuments());
  }

  function loadFromFile(file: File, shouldNavigate?: boolean) {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      try {
        const data: BackupDocument | BackupDocument[] = JSON.parse(reader.result as string);
        if (!Array.isArray(data)) {
          validate(data.id) && addDocument(data, shouldNavigate);
        } else {
          data.forEach((document: BackupDocument) => validate(document.id) && addDocument(document));
        }
      } catch (error) {
        dispatch(actions.announce({ message: { title: "Invalid file", subtitle: "Please select a valid .me file" } }));
      }
    }
  }

  function addDocument(document: BackupDocument, shouldNavigate?: boolean) {
    if (documents.find(d => d.id === document.id && d.local)) {
      dispatch(actions.alert({
        title: "Document already exists",
        content: `Do you want to overwrite ${document.name}?`,
        action: `dispatch(actions.updateLocalDocument({id:"${document.id}",partial:${JSON.stringify(document)}})).then(() => {${shouldNavigate ? `navigate("/edit/${document.id}");` : ""}})`
      }))
    } else {
      dispatch(actions.createLocalDocument(document)).then(() => {
        shouldNavigate && navigate(`/edit/${document.id}`);
      });
    }
  }

  async function backup() {
    try {
      const documents = await documentDB.getAll();
      const revisions = await revisionDB.getAll();
      const data: BackupDocument[] = documents.map(document => ({
        ...document,
        revisions: revisions.filter(revision => revision.documentId === document.id)
      }));

      const blob = new Blob([JSON.stringify(data)], { type: "text/json" });
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
      link.remove();
    } catch (error) {
      dispatch(actions.announce({ message: { title: "Backup failed", subtitle: "Please try again" } }));
    };
  };

  const sort = useSelector(state => state.ui.sort);
  const setSort = (payload: Partial<{ key: string, direction: "asc" | "desc" }>) => dispatch(actions.setSort(payload));
  const filter = useSelector(state => state.ui.filter);
  const setFilter = (value: number) => dispatch(actions.setFilter(value));

  const filteredDocuments = filterDocuments(documents, user, filter);
  const sortedDocuments = sortDocuments(filteredDocuments, sort);

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: "column", alignItems: "center", my: 5 }}>
        <Avatar sx={{ my: 2, bgcolor: 'primary.main' }}><PostAdd /></Avatar>
        <Button variant="outlined" component={RouterLink} prefetch={false} scroll={false} href="/new">New document</Button>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: { xs: "space-around", sm: "space-between" }, alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="h6" component="h2" sx={{ display: { xs: 'none', sm: 'block' } }}>Documents</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "center", mb: 1 }}>
          <DocumentSortControl value={sort} setValue={setSort} />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "center" }}>
            <Button variant="outlined" startIcon={<UploadFile />} component="label">
              Import
              <input type="file" hidden accept=".me" multiple onChange={e => handleFilesChange(e.target.files)} />
            </Button>
            <Button variant="outlined" startIcon={<Storage />} onClick={backup}>
              Backup
            </Button>
          </Box>
        </Box>
        <DocumentFilterControl value={filter} setValue={setFilter} />
      </Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Card variant="outlined">
            <CardActionArea component={RouterLink} prefetch={false} scroll={false} href="/playground">
              <CardHeader title="Playground" avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><Science /></Avatar>} />
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card variant="outlined">
            <CardActionArea component={RouterLink} prefetch={false} scroll={false} href="/tutorial">
              <CardHeader title="Tutorial" avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><Help /></Avatar>} />
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
      <Collapse timeout={1000} in={!(user && initialized)} unmountOnExit><Box sx={{ mb: 2 }}><UserCard user={user} /></Box></Collapse>
      {showAds && <FeedAd sx={{ mb: 2 }} />}
      <DocumentsGrid documents={sortedDocuments} initialized={initialized} user={user} />
    </>
  )
}

const DocumentsGrid: React.FC<{ documents: UserDocument[], user?: User, initialized: boolean }> = memo(({ documents, user, initialized }) => {
  const dispatch = useDispatch();
  const showSkeletons = !initialized && !documents.length;
  const showEmpty = initialized && !documents.length;
  const pageSize = 12;
  const pages = Math.ceil(documents.length / pageSize);
  const savedPage = useSelector(state => state.ui.page);
  const page = Math.min(savedPage, pages);
  const handlePageChange = (_: any, value: number) => dispatch(actions.setPage(value));
  const pageDocuments = documents.slice((page - 1) * pageSize, page * pageSize);

  return <Grid container spacing={2}>
    {showSkeletons && Array.from({ length: 6 }).map((_, i) => <Grid item key={i} xs={12} sm={6} md={4}><DocumentCard /></Grid>)}
    {showEmpty && <Grid item xs={12} sx={{ display: 'flex', flexDirection: "column", alignItems: "center", my: 5, gap: 2 }}>
      <Pageview sx={{ width: 64, height: 64, fontSize: 64 }} />
      <Typography variant="overline" component="p">No documents found</Typography>
    </Grid>}
    {pageDocuments.map(document => <Grid item key={document.id} xs={12} sm={6} md={4}>
      <DocumentCard userDocument={document} user={user} />
    </Grid>)}
    {pages > 1 && <Pagination count={pages} page={page} onChange={handlePageChange} sx={{ display: "flex", justifyContent: "center", mt: 3, width: "100%" }} />}
  </Grid>
});

export default Documents;
