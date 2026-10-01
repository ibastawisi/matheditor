"use client"
import { useAppStore } from "@/store";
import { BackupDocument, UserDocument } from "@/types";
import { Download } from "@mui/icons-material";
import { IconButton, ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import { enqueueSnackbar } from 'notistack';

const DownloadDocument: React.FC<{ userDocument: UserDocument, variant?: 'menuitem' | 'iconbutton', closeMenu?: () => void }> = ({ userDocument, variant = 'iconbutton', closeMenu }) => {
  const getLocalDocument = useAppStore(state => state.getLocalDocument);
  const getCloudDocument = useAppStore(state => state.getCloudDocument);
  const getLocalDocumentRevisions = useAppStore(state => state.getLocalDocumentRevisions);
  const localDocument = userDocument?.local;
  const isLocal = !!localDocument;
  const id = userDocument.id;

  const getEditorDocument = async () => {
    if (isLocal) {
      const { data: editorDocument } = await getLocalDocument(id);
      return editorDocument;
    }
    const { data: cloudResponse } = await getCloudDocument(id);
    if (!cloudResponse) return;
    const { cloudDocument, ...editorDocument } = cloudResponse;
    return editorDocument;
  };

  const getBackupDocument = async () => {
    const editorDocument = await getEditorDocument();
    if (!editorDocument) return null;
    const backupDocument: BackupDocument = { ...editorDocument, revisions: [] };
    const { data: revisions } = await getLocalDocumentRevisions(id);
    if (revisions) backupDocument.revisions = revisions.filter(revision => revision.id !== editorDocument.head);
    return backupDocument;
  };

  const handleSave = async () => {
    if (closeMenu) closeMenu();
    const backupDocument = await getBackupDocument();
    if (!backupDocument) return enqueueSnackbar("Document Not Found");
    const blob = new Blob([JSON.stringify(backupDocument)], { type: "text/json" });
    const link = window.document.createElement("a");

    link.download = backupDocument.name + ".me";
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

    const evt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(evt);
    link.remove();
  };

  if (variant === 'menuitem') return (
    <MenuItem onClick={handleSave}>
      <ListItemIcon>
        <Download />
      </ListItemIcon>
      <ListItemText>Download</ListItemText>
    </MenuItem>
  );
  return <IconButton aria-label="Download Document" onClick={handleSave} size="small"><Download /></IconButton>
}

export default DownloadDocument;
