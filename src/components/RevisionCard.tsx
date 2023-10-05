"use client"
import * as React from 'react';
import { UserDocumentRevision } from '@/types';
import { memo } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { Card, CardActionArea, CardHeader, Avatar, CardActions, Chip, IconButton } from '@mui/material';
import { Cloud, CloudSync, CloudUpload, Delete, MobileFriendly, Save } from '@mui/icons-material';
import { actions, useDispatch, useSelector } from '@/store';
import { CLEAR_HISTORY_COMMAND, type LexicalEditor } from '@/editor';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import NProgress from 'nprogress';

const RevisionCard: React.FC<{
  revision: UserDocumentRevision,
  editorRef: React.MutableRefObject<LexicalEditor | null>,
  sx?: SxProps<Theme> | undefined
}> = memo(({ revision, editorRef, sx }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const isOnline = useOnlineStatus();
  const userDocument = useSelector(state => state.documents.find(d => d.id === revision.documentId));
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocalDocument = !!localDocument;
  const isCloudDocument = !!cloudDocument;

  const localRevisions = useSelector(state => state.revisions.filter(r => r.documentId === revision.documentId));
  const cloudRevisions = cloudDocument?.revisions ?? [];
  const localRevision = localRevisions.find(r => r.id === revision.id);
  const isLocalRevision = !!localRevision;
  const cloudRevision = cloudRevisions.find(r => r.id === revision.id);
  const isCloudRevision = !!cloudRevision;
  const isLocalHead = isLocalDocument && localDocument.head === revision.id;
  const isCloudHead = isCloudDocument && isCloudRevision && cloudDocument.head === revision.id;
  const isSaved = isLocalRevision || isCloudRevision;
  const isHeadLocalRevision = localRevisions.some(r => r.id === localDocument?.head);
  const isHeadCloudRevision = cloudRevisions.some(r => r.id === localDocument?.head);
  const unsavedChanges = !isHeadLocalRevision && !isHeadCloudRevision;

  const isDocumentAuthor = isCloudDocument ? user?.id === cloudDocument.author.id : true;
  const isRevisionAuthor = isCloudRevision ? user?.id === cloudRevision.author.id : true;
  const showCreate = !isCloudRevision;
  const showUpdate = isOnline && isDocumentAuthor && isCloudRevision && !isCloudHead;
  const showDelete = isRevisionAuthor && !isLocalHead && !isCloudHead;

  const getEditorDocumentRevision = async () => {
    const localResponse = await dispatch(actions.getLocalRevision(revision.id));
    if (localResponse.type === actions.getLocalRevision.fulfilled.type) {
      const editorDocumentRevision = localResponse.payload as ReturnType<typeof actions.getLocalRevision.fulfilled>['payload'];
      return editorDocumentRevision;
    } else {
      const cloudResponse = await dispatch(actions.getCloudRevision(revision.id));
      if (cloudResponse.type === actions.getCloudRevision.fulfilled.type) {
        const editorDocumentRevision = cloudResponse.payload as ReturnType<typeof actions.getCloudRevision.fulfilled>['payload'];
        dispatch(actions.createLocalRevision(editorDocumentRevision));
        return editorDocumentRevision;
      }
    }
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

  const createRevision = async () => {
    if (unsavedChanges) await createLocalRevision();
    if (!isOnline) {
      dispatch(actions.announce({ message: "Please connect to the internet to use cloud storage", action: { label: "Reload", onClick: "window.location.reload()" } }));
      return;
    }
    if (!user) {
      dispatch(actions.announce({ message: "Please login to use cloud storage", action: { label: "Login", onClick: "login()" } }));
      return;
    }
    const editorDocumentRevision = await getEditorDocumentRevision();
    if (!editorDocumentRevision) {
      dispatch(actions.announce({ message: `Could not find revision data.` }));
      return;
    }
    if (isLocalDocument && !isCloudDocument) {
      const editorDocument = { ...localDocument, data: editorDocumentRevision.data };
      return dispatch(actions.createCloudDocument(editorDocument));
    }
    const response = await dispatch(actions.createCloudRevision(editorDocumentRevision));
    if (response.type === actions.createCloudRevision.rejected.type) return;
    return response.payload as ReturnType<typeof actions.createCloudRevision.fulfilled>['payload'];
  }

  const viewRevision = async () => {
    NProgress.start();
    if (unsavedChanges) await createLocalRevision();
    const editorDocumentRevision = await getEditorDocumentRevision();
    if (!editorDocumentRevision) return NProgress.done();
    const editor = editorRef.current;
    if (!editor) return NProgress.done();
    const state = editor.parseEditorState(editorDocumentRevision.data);
    const payload = { id: editorDocumentRevision.documentId, partial: { head: editorDocumentRevision.id, updatedAt: editorDocumentRevision.createdAt } };
    editor.update(() => {
      editor.setEditorState(state, { tag: JSON.stringify(payload) });
      editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
      NProgress.done();
    });
  }

  const updateCloudHead = async () => {
    if (!isLocalHead) viewRevision();
    const payload = { id: revision.documentId, partial: { head: revision.id, updatedAt: revision.createdAt } };
    await dispatch(actions.updateCloudDocument(payload));
  }

  const deleteRevision = () => {
    const variant = isLocalRevision ? 'Local' : 'Cloud';
    const title = `Delete ${variant} Revision?`;
    const content = `Are you sure you want to delete this ${variant} revision?`;
    const action = `dispatch(actions.delete${variant}Revision("${revision.id}"));`;
    dispatch(actions.alert({ title, content, action }));
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
      <CardActionArea sx={{ flexGrow: 1 }} onClick={viewRevision}>
        <CardHeader sx={{ alignItems: "start", '& .MuiCardHeader-content': { overflow: "hidden", textOverflow: "ellipsis" } }}
          title={new Date(revision.createdAt).toLocaleString()}
          subheader={(cloudRevision?.author ?? user)?.name ?? "Local User"}
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }} src={(cloudRevision?.author ?? user)?.image ?? undefined} alt={(cloudRevision?.author ?? user)?.name}></Avatar>}
        />
      </CardActionArea>
      <CardActions sx={{ "& button:first-of-type": { ml: "auto !important" }, '& .MuiChip-root:last-of-type': { mr: 1 } }}>
        {(isLocalRevision || isLocalHead) && <Chip color={isLocalHead ? "primary" : "default"} sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<MobileFriendly />} label="Local" />}
        {isCloudRevision && <Chip color={isCloudHead ? "primary" : "default"} sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Cloud />} label="Cloud" />}
        {showCreate && <Chip variant='outlined' clickable
          sx={{ width: 0, flex: 1, maxWidth: "fit-content" }}
          icon={<CloudUpload />}
          label="Save to Cloud"
          onClick={createRevision} />
        }
        {showUpdate && <IconButton aria-label="Update Cloud Head" size="small" onClick={updateCloudHead}><CloudSync /></IconButton>}
        {showDelete && <IconButton aria-label="Delete Revision" size="small" onClick={deleteRevision}><Delete /></IconButton>}
      </CardActions>
    </Card>
  );
});

export default RevisionCard;