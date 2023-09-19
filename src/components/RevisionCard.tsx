"use client"
import * as React from 'react';
import { CloudDocumentRevision, EditorDocument, isCloudDocument } from '@/types';
import { memo } from 'react';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import DeleteIcon from '@mui/icons-material/Delete';
import { actions, useDispatch, useSelector } from '@/store';
import { CLEAR_HISTORY_COMMAND } from '@/editor';
import { SxProps, Theme } from '@mui/material/styles';
import { Card, CardActionArea, CardHeader, Avatar, CardActions, Chip, IconButton } from '@mui/material';

const RevisionCard: React.FC<{ revision: CloudDocumentRevision, isHead: boolean, sx?: SxProps<Theme> | undefined }> = memo(({ revision, isHead, sx }) => {
  const dispatch = useDispatch();
  const cloudDocument = useSelector(state => state.documents.filter(isCloudDocument).find(document => document.id === revision.documentId));

  const restoreRevision = async () => {
    const response = await dispatch(actions.getLocalDocument(revision.documentId));
    if (response.type === actions.getLocalDocument.rejected.type) return dispatch(actions.announce({ message: "Couldn't find local document" }));
    const localDocument = response.payload as EditorDocument;
    if (!cloudDocument) return await dispatch(actions.createCloudDocument(localDocument));
    const isUpToDate = cloudDocument?.updatedAt === localDocument.updatedAt;
    if (!isUpToDate) {
      dispatch(actions.announce({ message: "Saving local changes before restoring revision" }));
      await dispatch(actions.updateCloudDocument({ id: revision.documentId, partial: { data: localDocument.data, updatedAt: localDocument.updatedAt } }));
    }
    await dispatch(actions.updateCloudDocument({ id: revision.documentId, partial: { head: revision.id, updatedAt: revision.createdAt } }));
    const res = await dispatch(actions.getCloudRevision(revision.id));
    if (res.type === actions.getCloudRevision.fulfilled.type) {
      const payload = res.payload as ReturnType<typeof actions.getCloudRevision.fulfilled>['payload'];
      const editor = window.editor;
      if (!editor) return;
      editor.update(() => {
        const state = editor.parseEditorState(payload.data);
        editor.setEditorState(state);
      })
      editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined)
      dispatch(actions.updateLocalDocument({ id: revision.documentId, partial: { data: payload.data, updatedAt: payload.createdAt } }));
    }
  }

  const deleteRevision = async () => {
    dispatch(actions.deleteCloudRevision(revision.id));
  }

  return (
    <Card variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        maxWidth: "100%",
        ...sx
      }}>
      <CardActionArea sx={{ flexGrow: 1 }} onClick={restoreRevision}>
        <CardHeader sx={{ alignItems: "start", '& .MuiCardHeader-content': { overflow: "hidden", textOverflow: "ellipsis" } }}
          title={new Date(revision.createdAt).toLocaleString()}
          subheader={revision.author.name}
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }} src={revision.author.image}></Avatar>}
        />
      </CardActionArea>
      <CardActions sx={{ "& button:first-of-type": { ml: "auto !important" }, '& .MuiChip-root:last-of-type': { mr: 1 } }}>
        {isHead && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<CloudDoneIcon />} label="Current" />}
        {!isHead && <>
          <IconButton aria-label="Delete Revision" size="small" disabled={isHead} onClick={deleteRevision}>
            <DeleteIcon />
          </IconButton>
        </>}
      </CardActions>
    </Card>
  );
});

export default RevisionCard;