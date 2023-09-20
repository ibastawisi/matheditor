import { EditorDocument, isCloudDocument } from '@/types';
import RevisionCard from './RevisionCard';
import { useDispatch, actions, useSelector } from '@/store';
import { Button, Drawer, Grid, IconButton, Typography } from '@mui/material';
import { Close, Restore } from '@mui/icons-material';
import { LexicalEditor } from '@/editor/types';
import { CLEAR_HISTORY_COMMAND } from '@/editor';
import { MutableRefObject, useState } from 'react';
import { createPortal } from 'react-dom';

export default function DocumentRevisions({ editorRef, document }: { editorRef: MutableRefObject<LexicalEditor | null>, document: EditorDocument }) {
  const user = useSelector(state => state.user);
  const cloudDocument = useSelector(state => state.documents.filter(isCloudDocument).find(d => d.id === document.id));
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const onClose = () => { setOpen(!open); };

  const getLocalDocument = async () => {
    const response = await dispatch(actions.getLocalDocument(document.id));
    if (response.type === actions.getLocalDocument.rejected.type) return;
    const localDocument = response.payload as EditorDocument;
    return localDocument;
  }

  const createRevision = async () => {
    const localDocument = await getLocalDocument();
    if (!localDocument) return dispatch(actions.announce({ message: "Couldn't find local document" }));
    if (!cloudDocument) return await dispatch(actions.createCloudDocument(localDocument));
    const isUpToDate = cloudDocument?.updatedAt === localDocument.updatedAt;
    if (isUpToDate) return dispatch(actions.announce({ message: "Document is up to date" }));
    return await dispatch(actions.updateCloudDocument({ id: document.id, partial: { data: localDocument.data, updatedAt: localDocument.updatedAt } }));
  };

  const restoreRevision = async (id: string) => {
    const localDocument = await getLocalDocument();
    if (!localDocument) return dispatch(actions.announce({ message: "Couldn't find local document" }));
    if (!cloudDocument) return await dispatch(actions.createCloudDocument(localDocument));
    const isUpToDate = cloudDocument?.updatedAt === localDocument.updatedAt;
    if (!isUpToDate) {
      dispatch(actions.announce({ message: "Saving local changes" }));
      await dispatch(actions.updateCloudDocument({ id: document.id, partial: { data: localDocument.data, updatedAt: localDocument.updatedAt } }));
    }
    const res = await dispatch(actions.getCloudRevision(id));
    if (res.type === actions.getCloudRevision.fulfilled.type) {
      const revision = res.payload as ReturnType<typeof actions.getCloudRevision.fulfilled>['payload'];
      const editor = editorRef.current;
      if (!editor) return;
      editor.update(() => {
        const state = editor.parseEditorState(revision.data);
        editor.setEditorState(state);
        editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined)
        dispatch(actions.updateLocalDocument({ id: document.id, partial: { data: revision.data, updatedAt: revision.createdAt } }));
        dispatch(actions.updateCloudDocument({ id: document.id, partial: { head: id, updatedAt: revision.createdAt } }));
      })
    }
  }

  const deleteRevision = (id: string) => { dispatch(actions.deleteCloudRevision(id)); }

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