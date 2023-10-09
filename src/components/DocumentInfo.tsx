import { LocalDocumentRevision, UserDocumentRevision } from '@/types';
import RevisionCard from './RevisionCard';
import { useSelector } from '@/store';
import { Avatar, Badge, Box, Chip, Grid, IconButton, SwipeableDrawer, Typography } from '@mui/material';
import { Article, Close, History, Info } from '@mui/icons-material';
import { LexicalEditor } from '@/editor/types';
import { MutableRefObject, useState } from 'react';
import { createPortal } from 'react-dom';
import RouterLink from "next/link";

export default function DocumentInfo({ editorRef, documentId }: { editorRef: MutableRefObject<LexicalEditor | null>, documentId: string }) {
  const userDocument = useSelector(state => state.documents.find(d => d.id === documentId));
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocalDocument = !!localDocument;
  const isCloudDocument = !!cloudDocument;
  const isUploaded = isLocalDocument && isCloudDocument;
  const isUpToDate = isUploaded && localDocument.updatedAt === cloudDocument.updatedAt;
  const localRevisions = useSelector(state => state.revisions);
  const localDocumentRevisions = localRevisions.filter(r => r.documentId === documentId);
  const cloudDocumentRevisions = cloudDocument?.revisions ?? [];
  const isHeadLocalRevision = localDocumentRevisions.some(r => r.id === localDocument?.head);
  const isHeadCloudRevision = cloudDocumentRevisions.some(r => r.id === localDocument?.head);
  const unsavedChanges = !isHeadLocalRevision && !isHeadCloudRevision;
  const isHeadOutOfSync = isUploaded && localDocument.head !== cloudDocument.head;

  const [open, setOpen] = useState(false);
  const onOpen = () => { setOpen(true); };
  const onClose = () => { setOpen(false); };

  const revisions: UserDocumentRevision[] = [...cloudDocumentRevisions];
  localDocumentRevisions.forEach(revision => { if (!revisions.find(r => r.id === revision.id)) revisions.push(revision); });
  const sortedRevisions = [...revisions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unsavedRevision = {
    id: localDocument?.head,
    documentId: localDocument?.id,
    createdAt: localDocument?.updatedAt,
  } as LocalDocumentRevision;
  if (unsavedChanges) sortedRevisions.unshift(unsavedRevision);

  return (
    <>
      <SwipeableDrawer
        anchor="right"
        open={open}
        onOpen={onOpen}
        onClose={onClose}
        sx={{ displayPrint: 'none' }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Article sx={{ mr: 1 }} />
            <Typography variant="h6">Document Info</Typography>
            <IconButton onClick={onClose} sx={{ ml: "auto" }}><Close /></IconButton>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: "start", justifyContent: "start", gap: 1, my: 3 }}>
            {localDocument && <>
              <Typography component="h2" variant="h6">{localDocument.name}</Typography>
            </>}
            {cloudDocument && <>
              <Typography variant="subtitle2">Author <Chip clickable component={RouterLink} prefetch={false}
                href={`/user/${cloudDocument.author.handle || cloudDocument.author.id}`}
                avatar={<Avatar alt={cloudDocument.author.name} src={cloudDocument.author.image || undefined} />}
                label={cloudDocument.author.name}
                variant="outlined"
              />
              </Typography>
              {cloudDocument.coauthors.length > 0 && <>
                <Typography component="h3" variant="subtitle2">Coauthors</Typography>
                {cloudDocument.coauthors.map(coauthor => (
                  <Chip clickable component={RouterLink} prefetch={false}
                    href={`/user/${coauthor.handle || coauthor.id}`}
                    key={coauthor.id}
                    avatar={<Avatar alt={coauthor.name} src={coauthor.image || undefined} />}
                    label={coauthor.name}
                    variant="outlined"
                  />
                ))}
              </>}
            </>}
          </Box>
          <Grid container spacing={1}>
            <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
              <History sx={{ mr: 1 }} />
              <Typography variant="h6">Revisions</Typography>
            </Grid>
            {sortedRevisions.map(revision => <Grid item xs={12} key={revision.id}><RevisionCard revision={revision} editorRef={editorRef} /></Grid>)}
          </Grid>
        </Box>
      </SwipeableDrawer>

      {createPortal(<IconButton aria-label="Revisions" color='inherit' onClick={onOpen}>
        {unsavedChanges || isHeadOutOfSync ? <Badge color="secondary" variant="dot"><Info /></Badge> : <Info />}
      </IconButton>, window.document.querySelector('#app-toolbar')!)}
    </>
  );
}