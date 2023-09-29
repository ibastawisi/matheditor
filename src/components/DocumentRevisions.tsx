import { DocumentRevision } from '@/types';
import RevisionCard from './RevisionCard';
import { useDispatch, actions, useSelector } from '@/store';
import { Avatar, Badge, Box, Button, Chip, Grid, IconButton, SwipeableDrawer, Typography } from '@mui/material';
import { Article, Close, Google, History, Login, Restore } from '@mui/icons-material';
import { LexicalEditor } from '@/editor/types';
import { CLEAR_HISTORY_COMMAND } from '@/editor';
import { MutableRefObject, useState } from 'react';
import { createPortal } from 'react-dom';
import { signIn } from 'next-auth/react';
import RouterLink from "next/link";

export default function DocumentRevisions({ editorRef, documentId }: { editorRef: MutableRefObject<LexicalEditor | null>, documentId: string }) {
  const user = useSelector(state => state.user);
  const userDocument = useSelector(state => state.documents.find(d => d.id === documentId));
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocal = !!localDocument;
  const isCloud = !!cloudDocument;
  const isUploaded = isLocal && isCloud;
  const isUpToDate = isUploaded && localDocument.updatedAt === cloudDocument.updatedAt;
  const isAuthor = isCloud ? cloudDocument.author.id === user?.id : true
  const isCoauthor = isCloud ? cloudDocument.coauthors.some(u => u.id === user?.id) : false;
  const hasLocalChanges = !localDocument?.head ? !isUpToDate : !cloudDocument?.revisions?.find(r => r.id === localDocument.head);
  const isHeadOutOfSync = localDocument?.head && cloudDocument && localDocument.head !== cloudDocument.head;

  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const onOpen = () => { setOpen(true); };
  const onClose = () => { setOpen(false); };

  const getRevision = async (revisionId: string) => {
    const response = await dispatch(actions.getCloudRevision(revisionId));
    if (response.type === actions.getCloudRevision.rejected.type) return;
    const revision = response.payload as ReturnType<typeof actions.getCloudRevision.fulfilled>['payload'];
    return revision;
  }

  const getLocalData = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const data = editor.getEditorState().toJSON();
    return data;
  }

  const createRevision = async () => {
    if (!localDocument) return dispatch(actions.announce({ message: "Couldn't find local document" }));
    const data = getLocalData();
    if (!data) return dispatch(actions.announce({ message: "Couldn't get local data" }));
    const editorDocument = { ...localDocument, data };
    if (!cloudDocument) return dispatch(actions.createCloudDocument(editorDocument));
    if (isUpToDate) return dispatch(actions.announce({ message: "Document is up to date" }));
    const response = await dispatch(actions.updateCloudDocument({ id: documentId, partial: { data, updatedAt: localDocument.updatedAt } }));
    if (response.type === actions.updateCloudDocument.rejected.type) return dispatch(actions.announce({ message: "Couldn't update cloud document" }));
    if (isAuthor) {
      const head = (response.payload as ReturnType<typeof actions.updateCloudDocument.fulfilled>['payload']).head;
      return dispatch(actions.updateLocalDocument({ id: documentId, partial: { head } }));
    }
    if (isCoauthor) {
      const cloudRevision = (response.payload as ReturnType<typeof actions.updateCloudDocument.fulfilled>['payload']).revisions[0];
      await dispatch(actions.updateLocalDocument({ id: documentId, partial: { head: cloudRevision.id } }));
      return dispatch(actions.announce({ message: "Revision has been submitted for review" }));
    }
  };

  const restoreRevision = async (revision: DocumentRevision) => {
    const isLocalHead = revision.id === localDocument?.head;
    const isCloudHead = cloudDocument && revision.id === cloudDocument.head;
    if (isLocalHead && isCloudHead) return;
    if (isLocalHead && !hasLocalChanges && isAuthor) return dispatch(actions.updateCloudDocument({
      id: revision.documentId,
      partial: { head: revision.id, updatedAt: revision.createdAt }
    }));
    if (hasLocalChanges) {
      dispatch(actions.announce({ message: "Saving local changes to the cloud" }));
      await createRevision();
    }
    const payload = { id: documentId, partial: { head: revision.id, updatedAt: revision.createdAt } };
    const editor = editorRef.current;
    if (!editor) return dispatch(actions.announce({ message: "Couldn't get editor state" }));
    const cloudRevision = await getRevision(revision.id);
    if (!cloudRevision) return dispatch(actions.announce({ message: "Couldn't find cloud revision data" }));
    const state = editor.parseEditorState(cloudRevision.data);
    editor.update(() => {
      editor.setEditorState(state, { tag: JSON.stringify(payload) });
      editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
    });
    if (isAuthor) return await dispatch(actions.updateCloudDocument(payload));
  }

  const deleteRevision = (revisionId: string) => {
    dispatch(actions.alert({
      title: 'Delete revision',
      content: 'Are you sure you want to permanently delete this revision?',
      action: `dispatch(actions.deleteCloudRevision("${revisionId}"));`
    }));
  }

  const localRevision = {
    id: localDocument?.head,
    documentId: localDocument?.id,
    createdAt: localDocument?.updatedAt,
    author: user,
  } as DocumentRevision;

  const login = () => signIn("google", undefined, { prompt: "select_account" });

  if (!document) return null;

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
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Last Updated: {new Date(localDocument.updatedAt).toLocaleDateString()}</Typography>

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
            {!user ? <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, my: 3, p: 1 }}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}><Login fontSize='large' /></Avatar>
              <Typography variant="overline" align='center'>You must be signed in to use cloud revisions</Typography>
              <Button size='small' startIcon={<Google />} onClick={login} sx={{ mt: 2 }}>
                <Typography variant="button" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Login with Google</Typography>
              </Button>
            </Grid>
              : <>
                {hasLocalChanges && <Grid item xs={12}>
                  <RevisionCard revision={localRevision} restoreRevision={createRevision} deleteRevision={() => { }} />
                </Grid>}
                {cloudDocument?.revisions?.map(revision => <Grid item xs={12} key={revision.id}>
                  <RevisionCard revision={revision}
                    restoreRevision={() => restoreRevision(revision)} deleteRevision={() => deleteRevision(revision.id)} />
                </Grid>)}
              </>
            }
          </Grid>
        </Box>
      </SwipeableDrawer>

      {createPortal(<IconButton aria-label="Revisions" color='inherit' onClick={onOpen}>
        {hasLocalChanges || isHeadOutOfSync ? <Badge color="secondary" variant="dot"><Restore /></Badge> : <Restore />}
      </IconButton>, window.document.querySelector('#app-toolbar')!)}
    </>
  );
}