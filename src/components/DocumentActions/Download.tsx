"use client"
import { useDispatch, actions } from "@/store";
import { UserDocument } from "@/types";
import { Download } from "@mui/icons-material";
import { IconButton, ListItemIcon, ListItemText, MenuItem } from "@mui/material";

const DownloadDocument: React.FC<{ userDocument: UserDocument, variant?: 'menuitem' | 'iconbutton', closeMenu?: () => void }> = ({ userDocument, variant = 'iconbutton', closeMenu }) => {
  const dispatch = useDispatch();
  const localDocument = userDocument?.local;
  const isLocal = !!localDocument;
  const id = userDocument.id;

  const getEditorDocument = async () => {
    if (isLocal) {
      const response = await dispatch(actions.getLocalDocument(id));
      if (response.type === actions.getLocalDocument.fulfilled.type) {
        const editorDocument = response.payload as ReturnType<typeof actions.getLocalDocument.fulfilled>["payload"];
        return editorDocument;
      }
    } else {
      const response = await dispatch(actions.getCloudDocument(id));
      if (response.type === actions.getCloudDocument.fulfilled.type) {
        const editorDocument = response.payload as ReturnType<typeof actions.getCloudDocument.fulfilled>["payload"];
        return editorDocument;
      }
    }
  };

  const handleSave = async () => {
    if (closeMenu) closeMenu();
    const editorDocument = await getEditorDocument();
    if (!editorDocument) return dispatch(actions.announce({ message: "Can't find document data" }));
    const blob = new Blob([JSON.stringify(editorDocument)], { type: "text/json" });
    const link = window.document.createElement("a");

    link.download = editorDocument.name + ".me";
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
