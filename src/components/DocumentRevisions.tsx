import { DocumentRevision, isCloudDocument, isLocalDocument } from '@/types';
import RevisionCard from './RevisionCard';
import { useDispatch, actions, useSelector } from '@/store';
import { Avatar, Badge, Button, Drawer, Grid, IconButton, Typography } from '@mui/material';
import { Close, Google, History, Login, Restore } from '@mui/icons-material';
import { LexicalEditor } from '@/editor/types';
import { CLEAR_HISTORY_COMMAND } from '@/editor';
import { MutableRefObject, useState } from 'react';
import { createPortal } from 'react-dom';
import { signIn } from 'next-auth/react';

export default function DocumentRevisions({ editorRef, documentId }: { editorRef: MutableRefObject<LexicalEditor | null>, documentId: string }) {
  const user = useSelector(state => state.user);
  const localDocument = useSelector(state => state.documents.filter(isLocalDocument).find(d => d.id === documentId));
  const cloudDocument = useSelector(state => state.documents.filter(isCloudDocument).find(d => d.id === documentId));
  const isUpToDate = localDocument?.updatedAt === cloudDocument?.updatedAt;
  const hasLocalChanges = !localDocument?.head ? !isUpToDate : !cloudDocument?.revisions?.find(r => r.id === localDocument.head);
  const isHeadOutOfSync = localDocument?.head && cloudDocument && localDocument.head !== cloudDocument.head;
  const cloudHasLocalHead = cloudDocument && cloudDocument.revisions.find(r => r.id === localDocument?.head);
  const isAuthor = cloudDocument ? cloudDocument.author.id === user?.id : true;
  const isCoauthor = cloudDocument ? cloudDocument.coauthors.some(u => u.id === user?.id) : false;

  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const onClose = () => { setOpen(!open); };

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
    const editorDocument = { ...localDocument, data, variant: undefined };
    if (!cloudDocument) return dispatch(actions.createCloudDocument(editorDocument));
    if (isUpToDate) return dispatch(actions.announce({ message: "Document is up to date" }));
    const response = await dispatch(actions.updateCloudDocument({ id: documentId, partial: { data, updatedAt: localDocument.updatedAt } }));
    if (response.type === actions.updateCloudDocument.rejected.type) return dispatch(actions.announce({ message: "Couldn't update cloud document" }));
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

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
      >
        <Grid container spacing={1} sx={{ p: 1, width: 280 }}>
          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
            <History sx={{ mr: 1 }} />
            <Typography variant="h6">Revisions</Typography>
            <IconButton onClick={onClose} sx={{ ml: "auto" }}><Close /></IconButton>
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
      </Drawer>
      {createPortal(<IconButton aria-label="Revisions" color='inherit' onClick={onClose}>
        {hasLocalChanges || isHeadOutOfSync ? <Badge color="secondary" variant="dot"><Restore /></Badge> : <Restore />}
      </IconButton>, window.document.querySelector('#app-toolbar')!)}
    </>
  );
}