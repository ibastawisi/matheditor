"use client"
import { useAppStore } from "@/store";
import { UserDocument } from "@/types";
import { Restore } from "@mui/icons-material";
import { Button, IconButton, ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import { SxProps, Theme } from '@mui/material/styles';
import { enqueueSnackbar } from 'notistack';

const RestoreDocument: React.FC<{ userDocument: UserDocument, variant?: 'menuitem' | 'button' | 'iconbutton', closeMenu?: () => void, sx?: SxProps<Theme> | undefined }> = ({ userDocument, variant = 'iconbutton', closeMenu, sx }) => {
  const getLocalDocument = useAppStore(state => state.getLocalDocument);
  const createLocalRevision = useAppStore(state => state.createLocalRevision);
  const getLocalRevision = useAppStore(state => state.getLocalRevision);
  const updateLocalDocument = useAppStore(state => state.updateLocalDocument);
  const getCloudDocument = useAppStore(state => state.getCloudDocument);
  const localDocument = userDocument.local!;
  const cloudDocument = userDocument.cloud!;
  const id = userDocument.id;
  const localDocumentRevisions = localDocument.revisions ?? [];
  const isLocalHeadLocalRevision = localDocumentRevisions.some(r => r.id === localDocument.head);
  const isCloudHeadLocalRevision = localDocumentRevisions.some(r => r.id === cloudDocument.head);

  const handleRestore = async () => {
    if (closeMenu) closeMenu();
    if (!isLocalHeadLocalRevision) {
      const { data: localEditorDocument } = await getLocalDocument(id);
      if (!localEditorDocument) return enqueueSnackbar("Document Not Found");
      const editorDocumentRevision = { id: localEditorDocument.head, documentId: localEditorDocument.id, createdAt: localEditorDocument.updatedAt, data: localEditorDocument.data };
      await createLocalRevision(editorDocumentRevision);
    }
    if (isCloudHeadLocalRevision) {
      const cloudDocument = userDocument.cloud!;
      const { data: localRevision } = await getLocalRevision(cloudDocument.head);
      if (!localRevision) return enqueueSnackbar("Local Revision Not Found");
      return updateLocalDocument({ id, partial: { head: cloudDocument.head, updatedAt: cloudDocument.updatedAt, data: localRevision.data } });
    }
    const { data: cloudResponse } = await getCloudDocument(id);
    if (!cloudResponse) return enqueueSnackbar("Cloud Document Not Found");
    const { cloudDocument, ...editorDocument } = cloudResponse;
    await createLocalRevision({ id: editorDocument.head, documentId: editorDocument.id, createdAt: editorDocument.updatedAt, data: editorDocument.data });
    return updateLocalDocument({ id, partial: editorDocument });
  };

  if (variant === 'menuitem') return (
    <MenuItem onClick={handleRestore} sx={sx}>
      <ListItemIcon>
        <Restore />
      </ListItemIcon>
      <ListItemText>
        Restore Cloud
      </ListItemText>
    </MenuItem>
  );
  if (variant === 'button') return <Button onClick={handleRestore} startIcon={<Restore />} sx={sx}>Restore Cloud</Button>;
  return <IconButton aria-label="Restore Cloud" onClick={handleRestore} size="small" sx={sx}>{<Restore />}</IconButton>
}

export default RestoreDocument;
