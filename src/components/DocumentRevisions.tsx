import { EditorDocument, isCloudDocument, isLocalDocument } from '@/types';
import RevisionCard from './RevisionCard';
import { useDispatch, actions, useSelector } from '@/store';
import { Button, Drawer, Grid, IconButton, Typography } from '@mui/material';
import { Close, Restore } from '@mui/icons-material';
import { LexicalEditor } from '@/editor/types';
import { CLEAR_HISTORY_COMMAND } from '@/editor';
import { MutableRefObject, useState } from 'react';
import { createPortal } from 'react-dom';

export default function DocumentRevisions({ editorRef, documentId }: { editorRef: MutableRefObject<LexicalEditor | null>, documentId: string }) {
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
    const editorDocument = { ...localDocument, data }
    if (!cloudDocument) return dispatch(actions.createCloudDocument(editorDocument));
    if (isUpToDate) return dispatch(actions.announce({ message: "Document is up to date" }));
    return dispatch(actions.updateCloudDocument({ id: documentId, partial: { data, updatedAt: localDocument.updatedAt } }));
  };

  const restoreRevision = async (revisionId: string) => {
    if (!isUpToDate) {
      dispatch(actions.announce({ message: "Saving local changes" }));
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
          <Grid item xs={12}>
            <Button variant="outlined" fullWidth onClick={createRevision}>Create Revision</Button>
          </Grid>
          {cloudDocument?.revisions?.map(revision => <Grid item xs={12} key={revision.id}>
            <RevisionCard revision={revision} isHead={revision.id === cloudDocument.head}
              restoreRevision={() => restoreRevision(revision.id)} deleteRevision={() => deleteRevision(revision.id)} />
          </Grid>)}
        </Grid>
      </Drawer>
      {createPortal(<IconButton aria-label="Revisions" color='inherit' onClick={onClose}><Restore /></IconButton>, window.document.querySelector('#app-toolbar')!)}
    </>
  );
}