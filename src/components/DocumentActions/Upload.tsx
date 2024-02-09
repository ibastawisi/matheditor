"use client"
import { useDispatch, actions, useSelector } from "@/store";
import { EditorDocument, UserDocument } from "@/types";
import { CloudSync, CloudUpload } from "@mui/icons-material";
import { Button, IconButton, ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import { SxProps, Theme } from '@mui/material/styles';

const UploadDocument: React.FC<{ userDocument: UserDocument, variant?: 'menuitem' | 'button' | 'iconbutton', closeMenu?: () => void, sx?: SxProps<Theme> | undefined }> = ({ userDocument, variant = 'iconbutton', closeMenu, sx }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocal = !!localDocument;
  const isCloud = !!cloudDocument;
  const isUploaded = isLocal && isCloud;
  const isUpToDate = isUploaded && localDocument.updatedAt === cloudDocument.updatedAt;
  const id = userDocument.id;
  const localRevisions = useSelector(state => state.revisions);
  const localDocumentRevisions = localRevisions.filter(r => r.documentId === userDocument.id);
  const cloudDocumentRevisions = cloudDocument?.revisions ?? [];
  const isHeadLocalRevision = localDocumentRevisions.some(r => r.id === localDocument?.head);
  const isHeadCloudRevision = cloudDocumentRevisions.some(r => r.id === localDocument?.head);
  const isHeadOutOfSync = isUploaded && localDocument.head !== cloudDocument.head;

  const handleCreate = async () => {
    if (closeMenu) closeMenu();
    if (!user) return       dispatch(actions.announce({
        message: {
          title: "You are not signed in",
          subtitle: "Please sign in to save your revision to the cloud"
        },
        action: { label: "Login", onClick: "login()" }
      }));
    const localResponse = await dispatch(actions.getLocalDocument(id));
    if (localResponse.type === actions.getLocalDocument.rejected.type) return dispatch(actions.announce({ message: { title: "Document Not Found" } }));
    const editorDocument = localResponse.payload as EditorDocument;
    if (!isHeadLocalRevision) {
      const editorDocumentRevision = { id: editorDocument.head, documentId: editorDocument.id, createdAt: editorDocument.updatedAt, data: editorDocument.data };
      await dispatch(actions.createLocalRevision(editorDocumentRevision));
    }
    return dispatch(actions.createCloudDocument(editorDocument));
  };

  const handleUpdate = async () => {
    if (closeMenu) closeMenu();
    if (!user) return       dispatch(actions.announce({
        message: {
          title: "You are not signed in",
          subtitle: "Please sign in to save your revision to the cloud"
        },
        action: { label: "Login", onClick: "login()" }
      }));
    if (isUpToDate) return dispatch(actions.announce({ message: { title: "Document is already Up to Date" } }));
    if (isHeadCloudRevision && isHeadOutOfSync) return dispatch(actions.updateCloudDocument({ id, partial: { head: localDocument.head, updatedAt: localDocument.updatedAt } }));
    const localResponse = await dispatch(actions.getLocalDocument(id));
    if (localResponse.type === actions.getLocalDocument.rejected.type) return dispatch(actions.announce({ message: { title: "Document Not Found" } }));
    const editorDocument = localResponse.payload as ReturnType<typeof actions.getLocalDocument.fulfilled>["payload"];
    if (!isHeadLocalRevision) {
      const editorDocumentRevision = { id: editorDocument.head, documentId: editorDocument.id, createdAt: editorDocument.updatedAt, data: editorDocument.data };
      await dispatch(actions.createLocalRevision(editorDocumentRevision));
    }
    return dispatch(actions.updateCloudDocument({ id, partial: editorDocument }));
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
