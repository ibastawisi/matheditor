"use client"
import { useAppStore } from "@/store";
import { UserDocument } from "@/types";
import { CloudSync, CloudUpload } from "@mui/icons-material";
import { Button, IconButton, ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import { SxProps, Theme } from '@mui/material/styles';
import { enqueueSnackbar } from 'notistack';
import { signIn } from 'next-auth/react';

const UploadDocument: React.FC<{ userDocument: UserDocument, variant?: 'menuitem' | 'button' | 'iconbutton', closeMenu?: () => void, sx?: SxProps<Theme> | undefined }> = ({ userDocument, variant = 'iconbutton', closeMenu, sx }) => {
  const getLocalDocument = useAppStore(state => state.getLocalDocument);
  const createLocalRevision = useAppStore(state => state.createLocalRevision);
  const createCloudDocument = useAppStore(state => state.createCloudDocument);
  const updateCloudDocument = useAppStore(state => state.updateCloudDocument);
  const user = useAppStore(state => state.user);
  const login = () => signIn("google", undefined, { prompt: "select_account" });
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocal = !!localDocument;
  const isCloud = !!cloudDocument;
  const isUploaded = isLocal && isCloud;
  const isUpToDate = isUploaded && localDocument.head === cloudDocument.head;
  const id = userDocument.id;
  const localDocumentRevisions = localDocument?.revisions ?? [];
  const cloudDocumentRevisions = cloudDocument?.revisions ?? [];
  const isHeadLocalRevision = localDocumentRevisions.some(r => r.id === localDocument?.head);
  const isHeadCloudRevision = cloudDocumentRevisions.some(r => r.id === localDocument?.head);
  const isHeadOutOfSync = isUploaded && localDocument.head !== cloudDocument.head;

  const handleCreate = async () => {
    if (closeMenu) closeMenu();
    if (!user) return enqueueSnackbar("You are not signed in", {
      description: "Please sign in to save your revision to the cloud",
      action: <Button color="secondary" size="small" onClick={login}>Login</Button>,
    });
    const { data: editorDocument } = await getLocalDocument(id);
    if (!editorDocument) return enqueueSnackbar("Document Not Found");
    if (!isHeadLocalRevision) {
      const editorDocumentRevision = { id: editorDocument.head, documentId: editorDocument.id, createdAt: editorDocument.updatedAt, data: editorDocument.data };
      await createLocalRevision(editorDocumentRevision);
    }
    return createCloudDocument(editorDocument);
  };

  const handleUpdate = async () => {
    if (closeMenu) closeMenu();
    if (!user) return enqueueSnackbar("You are not signed in", {
      description: "Please sign in to save your revision to the cloud",
      action: <Button color="secondary" size="small" onClick={login}>Login</Button>,
    });
    if (isUpToDate) return enqueueSnackbar("Document is already Up to Date");
    if (isHeadCloudRevision && isHeadOutOfSync) return updateCloudDocument({ id, partial: { head: localDocument.head, updatedAt: localDocument.updatedAt } });
    const { data: editorDocument } = await getLocalDocument(id);
    if (!editorDocument) return enqueueSnackbar("Document Not Found");
    if (!isHeadLocalRevision) {
      const editorDocumentRevision = { id: editorDocument.head, documentId: editorDocument.id, createdAt: editorDocument.updatedAt, data: editorDocument.data };
      await createLocalRevision(editorDocumentRevision);
    }
    return updateCloudDocument({ id, partial: editorDocument });
  };

  if (variant === 'menuitem') return (
    <MenuItem onClick={isUploaded ? handleUpdate : handleCreate} sx={sx}>
      <ListItemIcon>
        {isUploaded ? <CloudSync /> : <CloudUpload />}
      </ListItemIcon>
      <ListItemText>
        {isUploaded ? "Update Cloud" : "Save to Cloud"}
      </ListItemText>
    </MenuItem>
  );
  if (variant === 'button') return <Button onClick={isUploaded ? handleUpdate : handleCreate} startIcon={isUploaded ? <CloudSync /> : <CloudUpload />} sx={sx}>{isUploaded ? "Update Cloud" : "Save to Cloud"}</Button>;
  return <IconButton aria-label="Upload Document" onClick={isUploaded ? handleUpdate : handleCreate} size="small" sx={sx}>{isUploaded ? <CloudSync /> : <CloudUpload />}</IconButton>
}

export default UploadDocument;
