import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import { usePathname } from 'next/navigation';
import { EditorDocument, isCloudDocument } from '@/types';
import RevisionCard from './RevisionCard';
import { useDispatch, actions, useSelector } from '@/store';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export default function DocumentRevisions({ open, onClose }: { open: boolean, onClose: () => void }) {
  const pathname = usePathname();
  const id = pathname.split('/')[2];
  const document = useSelector(state => state.documents.filter(isCloudDocument).find(document => document.id === id || document.handle === id));

  const user = useSelector(state => state.user);
  const dispatch = useDispatch();

  const createRevision = async () => {
    if (!user) return dispatch(actions.announce({ message: "Please login to use cloud storage" }));
    const response = await dispatch(actions.getLocalDocument(id));
    if (response.type === actions.getLocalDocument.rejected.type) return dispatch(actions.announce({ message: "Couldn't find local document" }));
    const localDocument = response.payload as EditorDocument;
    if (!document) return await dispatch(actions.createCloudDocument(localDocument));
    const isUpToDate = document?.updatedAt === localDocument.updatedAt;
    if (isUpToDate) return dispatch(actions.announce({ message: "Document is up to date" }));
    return await dispatch(actions.updateCloudDocument({ id: document.id ?? id, partial: { data: localDocument.data, updatedAt: localDocument.updatedAt } }));
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
    >
      <Grid container spacing={1} sx={{ p: 1, width: 280 }}>
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Revisions</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Grid>
        <Grid item xs={12}>
          <Button variant="outlined" fullWidth onClick={createRevision}>Create Revision</Button>
        </Grid>
        {document && document.revisions.map(revision => <Grid item xs={12} key={revision.id}><RevisionCard revision={revision} isHead={revision.id === document.head} /></Grid>)}
      </Grid>
    </Drawer>
  );
}