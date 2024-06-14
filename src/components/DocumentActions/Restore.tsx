"use client"
import { useDispatch, actions } from "@/store";
import { UserDocument } from "@/types";
import { Restore } from "@mui/icons-material";
import { Button, IconButton, ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import { SxProps, Theme } from '@mui/material/styles';

const RestoreDocument: React.FC<{ userDocument: UserDocument, variant?: 'menuitem' | 'button' | 'iconbutton', closeMenu?: () => void, sx?: SxProps<Theme> | undefined }> = ({ userDocument, variant = 'iconbutton', closeMenu, sx }) => {
  const dispatch = useDispatch();
  const localDocument = userDocument.local!;
  const cloudDocument = userDocument.cloud!;
  const id = userDocument.id;
  const localDocumentRevisions = localDocument.revisions ?? [];
  const isLocalHeadLocalRevision = localDocumentRevisions.some(r => r.id === localDocument.head);
  const isCloudHeadLocalRevision = localDocumentRevisions.some(r => r.id === cloudDocument.head);

  const handleRestore = async () => {
    if (closeMenu) closeMenu();
    if (!isLocalHeadLocalRevision) {
      const localResponse = await dispatch(actions.getLocalDocument(id));
      if (localResponse.type === actions.getLocalDocument.rejected.type) return dispatch(actions.announce({ message: { title: "Document Not Found" } }));
      const localEditorDocument = localResponse.payload as ReturnType<typeof actions.getLocalDocument.fulfilled>["payload"];
      const editorDocumentRevision = { id: localEditorDocument.head, documentId: localEditorDocument.id, createdAt: localEditorDocument.updatedAt, data: localEditorDocument.data };
      await dispatch(actions.createLocalRevision(editorDocumentRevision));
    }
    if (isCloudHeadLocalRevision) {
      const cloudDocument = userDocument.cloud!;
      const localRevisionResponse = await dispatch(actions.getLocalRevision(cloudDocument.head));
      if (localRevisionResponse.type === actions.getLocalRevision.rejected.type) return dispatch(actions.announce({ message: { title: "Local Revision Not Found" } }));
      const localRevision = localRevisionResponse.payload as ReturnType<typeof actions.getLocalRevision.fulfilled>["payload"];
      return dispatch(actions.updateLocalDocument({ id, partial: { head: cloudDocument.head, updatedAt: cloudDocument.updatedAt, data: localRevision.data } }));
    }
    const cloudResponse = await dispatch(actions.getCloudDocument(id));
    if (cloudResponse.type === actions.getCloudDocument.rejected.type) return dispatch(actions.announce({ message: { title: "Cloud Document Not Found" } }));
    const { cloudDocument, ...editorDocument } = cloudResponse.payload as ReturnType<typeof actions.getCloudDocument.fulfilled>["payload"];
    await dispatch(actions.createLocalRevision({ id: editorDocument.head, documentId: editorDocument.id, createdAt: editorDocument.updatedAt, data: editorDocument.data }));
    return dispatch(actions.updateLocalDocument({ id, partial: editorDocument }));
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
