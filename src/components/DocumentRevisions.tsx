import { DocumentRevision, isCloudDocument, isLocalDocument } from '@/types';
import RevisionCard from './RevisionCard';
import { useDispatch, actions, useSelector } from '@/store';
import { Avatar, Button, Drawer, Grid, IconButton, Typography } from '@mui/material';
import { Close, Google, Login, Restore } from '@mui/icons-material';
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
    return dispatch(actions.updateCloudDocument({ id: documentId, partial: { data, updatedAt: localDocument.updatedAt } }));
  };

  const restoreRevision = async (revisionId: string) => {
    if (!isUpToDate) {
      dispatch(actions.announce({ message: "Saving local changes to the cloud" }));
      await createRevision();
    }
    const revision = await getRevision(revisionId);
    if (!revision) return dispatch(actions.announce({ message: "Couldn't find revision data" }));
    const editor = editorRef.current;
    if (!editor) return dispatch(actions.announce({ message: "Couldn't get editor state" }));
    const state = editor.parseEditorState(revision.data);
    const payload = { id: documentId, partial: { head: revisionId, updatedAt: revision.createdAt } };
    editor.update(() => {
      editor.setEditorState(state, { tag: JSON.stringify(payload) });
      editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
    });
    dispatch(actions.updateCloudDocument(payload));
  }

  const deleteRevision = (revisionId: string) => { dispatch(actions.deleteCloudRevision(revisionId)); }
  const localRevision = {
    id: localDocument?.head,
    documentId: localDocument?.id,
    createdAt: localDocument?.updatedAt,
    author: user,
  } as DocumentRevision;
  const showLocalRevision = !isUpToDate && !cloudDocument?.revisions?.find(r => r.id === localRevision.id);

  const login = () => signIn("google", undefined, { prompt: "select_account" });

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
      >
        <Grid container spacing={1} sx={{ p: 1, width: 280 }}>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Revisions</Typography>
            <IconButton onClick={onClose}><Close /></IconButton>
          </Grid>
          {!user ? <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, my: 3, p: 1 }}>
            <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}><Login fontSize='large' /></Avatar>
            <Typography variant="overline" align='center'>You must be signed in to use cloud revisions</Typography>
            <Button size='small' startIcon={<Google />} onClick={login} sx={{ mt: 2 }}>
              <Typography variant="button" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Login with Google</Typography>
            </Button>
          </Grid>
            : <>
              {showLocalRevision && <Grid item xs={12}>
                <RevisionCard revision={localRevision} restoreRevision={createRevision} deleteRevision={() => { }} />
              </Grid>}
              {cloudDocument?.revisions?.map(revision => <Grid item xs={12} key={revision.id}>
                <RevisionCard revision={revision}
                  restoreRevision={() => restoreRevision(revision.id)} deleteRevision={() => deleteRevision(revision.id)} />
              </Grid>)}
            </>
          }
        </Grid>
      </Drawer>
      {createPortal(<IconButton aria-label="Revisions" color='inherit' onClick={onClose}><Restore /></IconButton>, window.document.querySelector('#app-toolbar')!)}
    </>
  );
}