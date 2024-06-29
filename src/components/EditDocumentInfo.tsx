import { LocalDocumentRevision, User, UserDocumentRevision } from '@/types';
import RevisionCard from './EditRevisionCard';
import { actions, useDispatch, useSelector } from '@/store';
import { Avatar, Badge, Box, Button, Chip, Grid, IconButton, Portal, Typography } from '@mui/material';
import { Close, Compare, History, Print } from '@mui/icons-material';
import type { LexicalEditor } from '@/editor';
import { MutableRefObject } from 'react';
import RouterLink from "next/link";
import ShareDocument from './DocumentActions/Share';
import DownloadDocument from './DocumentActions/Download';
import ForkDocument from './DocumentActions/Fork';
import EditDocument from './DocumentActions/Edit';
import AppDrawer from './AppDrawer';

export default function EditDocumentInfo({ editorRef, documentId }: { editorRef: MutableRefObject<LexicalEditor | null>, documentId: string }) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const userDocument = useSelector(state => state.documents.find(d => d.id === documentId));
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isCloud = !!cloudDocument;
  const localDocumentRevisions = localDocument?.revisions ?? [];
  const cloudDocumentRevisions = cloudDocument?.revisions ?? [];
  const isHeadLocalRevision = localDocumentRevisions.some(r => r.id === localDocument?.head);
  const isHeadCloudRevision = cloudDocumentRevisions.some(r => r.id === localDocument?.head);
  const isAuthor = isCloud ? cloudDocument.author.id === user?.id : true
  const isCollab = isCloud && cloudDocument.collab;
  const collaborators = isCollab ? cloudDocument.revisions.reduce((acc, rev) => {
    if (rev.author.id !== cloudDocument.author.id &&
      !cloudDocument.coauthors.some(u => u.id === rev.author.id) &&
      !acc.find(u => u.id === rev.author.id)) acc.push(rev.author);
    return acc;
  }, [] as User[]) : [];

  const revisions: UserDocumentRevision[] = [...cloudDocumentRevisions];
  localDocumentRevisions.forEach(revision => { if (!cloudDocumentRevisions.some(r => r.id === revision.id)) revisions.push(revision); });
  const documentRevisions = [...revisions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unsavedChanges = !isHeadLocalRevision && !isHeadCloudRevision;
  if (unsavedChanges) {
    const unsavedRevision = { id: localDocument?.head, documentId: localDocument?.id, createdAt: localDocument?.updatedAt } as LocalDocumentRevision;
    documentRevisions.unshift(unsavedRevision);
  }

  const revisionsBadgeContent = revisions.length;
  const showRevisionsBadge = revisionsBadgeContent > 0;

  const isDiffViewOpen = useSelector(state => state.ui.diff.open);
  const toggleDiffView = async () => {
    if (unsavedChanges) await createLocalRevision();
    const newRevisionId = documentRevisions[0]?.id;
    const oldRevisionId = documentRevisions[1]?.id ?? newRevisionId;
    dispatch(actions.setDiff({ open: !isDiffViewOpen, old: oldRevisionId, new: newRevisionId }));
  }
  const getLocalEditorData = () => editorRef.current?.getEditorState().toJSON();

  const createLocalRevision = async () => {
    if (!localDocument) return;
    const data = getLocalEditorData();
    if (!data) return;
    const payload = {
      id: localDocument.head,
      documentId: localDocument.id,
      createdAt: localDocument.updatedAt,
      data,
    }
    const response = await dispatch(actions.createLocalRevision(payload));
    if (response.type === actions.createLocalRevision.rejected.type) return;
    return response.payload as ReturnType<typeof actions.createLocalRevision.fulfilled>['payload'];
  }

  return (
    <>
      <AppDrawer title="Document Info">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: "start", justifyContent: "start", gap: 1, my: 3 }}>
          {localDocument && <>
            <Typography component="h2" variant="h6">{localDocument.name}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Created: {new Date(localDocument.createdAt).toLocaleString()}</Typography>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Updated: {new Date(localDocument.updatedAt).toLocaleString()}</Typography>
            {!cloudDocument && <Typography variant="subtitle2">Author <Chip
              avatar={<Avatar />}
              label={user?.name ?? "Local User"}
              variant="outlined"
            />
            </Typography>}
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
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {cloudDocument.coauthors.map(coauthor => (
                  <Chip clickable component={RouterLink} prefetch={false}
                    href={`/user/${coauthor.handle || coauthor.id}`}
                    key={coauthor.id}
                    avatar={<Avatar alt={coauthor.name} src={coauthor.image || undefined} />}
                    label={coauthor.name}
                    variant="outlined"
                  />
                ))}
              </Box>
            </>}
            {collaborators.length > 0 && <>
              <Typography component="h3" variant="subtitle2">Collaborators</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {collaborators.map(user => (
                  <Chip clickable component={RouterLink} prefetch={false}
                    href={`/user/${user.handle || user.id}`}
                    key={user.id}
                    avatar={<Avatar alt={user.name} src={user.image || undefined} />}
                    label={user.name}
                    variant="outlined"
                  />
                ))}
              </Box>
            </>}
          </>}
          {userDocument && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, alignSelf: "flex-end" }}>
            <IconButton aria-label="Print" color="inherit" onClick={() => { window.print(); }}><Print /></IconButton>
            <ShareDocument userDocument={userDocument} />
            <ForkDocument userDocument={userDocument} />
            <DownloadDocument userDocument={userDocument} />
            {isAuthor && <EditDocument userDocument={userDocument} />}
          </Box>}
        </Box>
        <Grid container spacing={1}>
          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
            <History sx={{ mr: 1 }} />
            <Typography variant="h6">Revisions</Typography>
            <Button sx={{ ml: 'auto' }} onClick={toggleDiffView} endIcon={isDiffViewOpen ? <Close /> : <Compare />}>
              {isDiffViewOpen ? "Exit" : "Compare"}
            </Button>
          </Grid>
          {documentRevisions.map(revision => <Grid item xs={12} key={revision.id}><RevisionCard revision={revision} editorRef={editorRef} /></Grid>)}
        </Grid>
      </AppDrawer>
      {showRevisionsBadge && <Portal container={document.querySelector('#document-info')}>
        <Badge badgeContent={revisionsBadgeContent} color="secondary"></Badge>
      </Portal>}
    </>
  );
}