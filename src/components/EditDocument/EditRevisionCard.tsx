"use client"
import * as React from 'react';
import { UserDocumentRevision } from '@/types';
import { memo } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { Card, CardActionArea, CardHeader, Avatar, CardActions, Chip, IconButton, Button } from '@mui/material';
import { Cloud, CloudSync, CloudUpload, Delete, DeleteForever, History, MobileFriendly, Update } from '@mui/icons-material';
import { useAppStore } from '@/store';
import { CLEAR_HISTORY_COMMAND, type LexicalEditor } from 'lexical';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import NProgress from 'nprogress';
import { enqueueSnackbar } from 'notistack';
import { alert } from '@/shared/alert';
import { signIn } from 'next-auth/react';

const RevisionCard: React.FC<{
  revision: UserDocumentRevision,
  editorRef: React.RefObject<LexicalEditor | null>,
  sx?: SxProps<Theme> | undefined
}> = memo(({ revision, editorRef, sx }) => {
  const setDiff = useAppStore(state => state.setDiff);
  const getLocalRevision = useAppStore(state => state.getLocalRevision);
  const getCloudRevision = useAppStore(state => state.getCloudRevision);
  const createLocalRevision = useAppStore(state => state.createLocalRevision);
  const createCloudDocument = useAppStore(state => state.createCloudDocument);
  const createCloudRevision = useAppStore(state => state.createCloudRevision);
  const updateCloudDocument = useAppStore(state => state.updateCloudDocument);
  const deleteLocalRevision = useAppStore(state => state.deleteLocalRevision);
  const deleteCloudRevision = useAppStore(state => state.deleteCloudRevision);
  const user = useAppStore(state => state.user);
  const login = () => signIn("google", undefined, { prompt: "select_account" });
  const isOnline = useOnlineStatus();
  const userDocument = useAppStore(state => state.documents.find(d => d.id === revision.documentId));
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocalDocument = !!localDocument;
  const isCloudDocument = !!cloudDocument;
  const localDocumentRevisions = localDocument?.revisions ?? [];
  const cloudDocumentRevisions = cloudDocument?.revisions ?? [];
  const localRevision = localDocumentRevisions.find(r => r.id === revision.id);
  const isLocalRevision = !!localRevision;
  const cloudRevision = cloudDocumentRevisions.find(r => r.id === revision.id);
  const isCloudRevision = !!cloudRevision;
  const isLocalHead = isLocalDocument && localDocument.head === revision.id;
  const isCloudHead = isCloudDocument && isCloudRevision && cloudDocument.head === revision.id;
  const isCloudOnlyRevision = isCloudRevision && !isLocalRevision;
  const isLastCopy = isCloudOnlyRevision || isCloudOnlyRevision;
  const isHeadLocalRevision = localDocumentRevisions.some(r => r.id === localDocument?.head);
  const isHeadCloudRevision = cloudDocumentRevisions.some(r => r.id === localDocument?.head);
  const unsavedChanges = !isHeadLocalRevision && !isHeadCloudRevision;

  const isDocumentAuthor = isCloudDocument ? user?.id === cloudDocument.author.id : true;
  const isRevisionAuthor = isCloudRevision ? user?.id === cloudRevision.author.id : true;
  const diff = useAppStore(state => state.diff);
  const showLocal = !diff.open && (isLocalRevision || isLocalHead);
  const showCloud = !diff.open && isCloudRevision;
  const showCreate = !diff.open && !isCloudRevision;
  const showUpdate = isOnline && isDocumentAuthor && isCloudRevision && !isCloudHead;
  const showDelete = !diff.open && isRevisionAuthor && !isLocalHead && !isCloudHead;
  const showDiff = diff.open;
  const isOld = diff.old === revision.id;
  const isNew = diff.new === revision.id;

  const setAsOld = () => setDiff({ old: revision.id });
  const setAsNew = () => setDiff({ new: revision.id });

  const getEditorDocumentRevision = async () => {
    const { data: localRevision } = await getLocalRevision(revision.id);
    if (localRevision) return localRevision;
    const { data: cloudRevision } = await getCloudRevision(revision.id);
    if (!cloudRevision) return;
    createLocalRevision(cloudRevision);
    return cloudRevision;
  }

  const getLocalEditorData = () => editorRef.current?.getEditorState().toJSON();

  const saveEditorRevision = async () => {
    if (!localDocument) return;
    const data = getLocalEditorData();
    if (!data) return;
    const payload = {
      id: localDocument.head,
      documentId: localDocument.id,
      createdAt: localDocument.updatedAt,
      data,
    }
    const { data: localRevision } = await createLocalRevision(payload);
    return localRevision;
  }

  const createRevision = async () => {
    if (unsavedChanges) await saveEditorRevision();
    if (!isOnline) {
      enqueueSnackbar("You are offline", {
        description: "Please connect to the internet to save to cloud storage",
        action: <Button color="secondary" size="small" onClick={() => window.location.reload()}>Reload</Button>,
      });
      return;
    }
    if (!user) {
      enqueueSnackbar("You are not signed in", {
        description: "Please sign in to save your revision to the cloud",
        action: <Button color="secondary" size="small" onClick={login}>Login</Button>,
      });
      return;
    }
    const editorDocumentRevision = await getEditorDocumentRevision();
    if (!editorDocumentRevision) {
      enqueueSnackbar("Revision Not Found", { description: "Please try again later" });
      return;
    }
    if (isLocalDocument && !isCloudDocument) {
      const editorDocument = { ...localDocument, data: editorDocumentRevision.data, revisions: [] };
      return createCloudDocument(editorDocument);
    }
    const { data: cloudRevision } = await createCloudRevision(editorDocumentRevision);
    return cloudRevision;
  }

  const viewRevision = async () => {
    NProgress.start();
    if (unsavedChanges) await saveEditorRevision();
    if (diff.open) setDiff({ old: revision.id, new: revision.id });
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
    await updateCloudDocument(payload);
  }

  const deleteRevision = async () => {
    const variant = isLocalRevision ? 'Local' : 'Cloud';
    const confirmed = await alert({
      title: `Delete ${variant} Revision?`,
      description: `Are you sure you want to delete this ${variant} revision?`,
      confirmText: "Delete",
      buttonVariant: "destructive",
    });
    if (confirmed) {
      if (isLocalRevision) deleteLocalRevision({ id: revision.id, documentId: revision.documentId });
      else deleteCloudRevision({ id: revision.id, documentId: revision.documentId });
    }
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
          title={new Date(revision.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          subheader={(cloudRevision?.author ?? user)?.name ?? "Local User"}
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }} src={(cloudRevision?.author ?? user)?.image ?? undefined} alt={(cloudRevision?.author ?? user)?.name}></Avatar>}
        />
      </CardActionArea>
      <CardActions sx={{ "& button:first-of-type": { ml: "auto !important" }, '& .MuiChip-root:last-of-type': { mr: 1 } }}>
        {showLocal && <Chip color={isLocalHead ? "primary" : "default"} sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<MobileFriendly />} label="Local" />}
        {showCloud && <Chip color={isCloudHead ? "primary" : "default"} sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Cloud />} label="Cloud" />}
        {showDiff && <Chip color={isOld ? "primary" : "default"} sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<History />} label="Old" onClick={setAsOld} disabled={!isOnline && !isLocalRevision} />}
        {showDiff && <Chip color={isNew ? "primary" : "default"} sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Update />} label="New" onClick={setAsNew} disabled={!isOnline && !isLocalRevision} />}
        {showCreate && <Chip variant='outlined' clickable sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<CloudUpload />} label="Save to Cloud" onClick={createRevision} />}
        {showUpdate && <IconButton aria-label="Update Cloud Head" size="small" onClick={updateCloudHead}><CloudSync /></IconButton>}
        {showDelete && <IconButton aria-label="Delete Revision" size="small" onClick={deleteRevision}>{isLastCopy ? <DeleteForever /> : <Delete />}</IconButton>}
      </CardActions>
    </Card>
  );
});

export default RevisionCard;