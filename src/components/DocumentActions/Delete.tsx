"use client"
import { useAppStore } from "@/store";
import { UserDocument } from "@/types";
import { Delete, DeleteForever } from "@mui/icons-material";
import { IconButton, ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import { alert } from "@/shared/alert";

const DeleteDocument: React.FC<{ userDocument: UserDocument, variant?: 'menuitem' | 'iconbutton', closeMenu?: () => void }> = ({ userDocument, variant = 'iconbutton', closeMenu }) => {
  const deleteLocalDocument = useAppStore(state => state.deleteLocalDocument);
  const deleteCloudDocument = useAppStore(state => state.deleteCloudDocument);
  const localDocument = userDocument.local;
  const cloudDocument = userDocument.cloud;
  const isLocal = !!localDocument;
  const isCloud = !!cloudDocument;
  const isLastCopy = (isLocal && !isCloud) || (isCloud && !isLocal);
  const id = userDocument.id;
  const name = localDocument?.name || cloudDocument?.name || "This Document";

  const handleDelete = async () => {
    if (closeMenu) closeMenu();
    const confirmed = await alert({
      title: `Delete ${isLocal ? "Local" : "Cloud"} Document`,
      description: `Are you sure you want to delete ${name}?`,
      confirmText: "Delete",
      buttonVariant: "destructive",
    });
    if (confirmed) {
      isLocal ? deleteLocalDocument(id) : deleteCloudDocument(id);
    }
  };

  if (variant === 'menuitem') return (
    <MenuItem onClick={handleDelete}>
      <ListItemIcon>
        {isLastCopy ? <DeleteForever /> : <Delete />}
      </ListItemIcon>
      <ListItemText>Delete</ListItemText>
    </MenuItem>
  );
  return <IconButton aria-label="Delete Document" onClick={handleDelete} size="small">{isLastCopy ? <DeleteForever /> : <Delete />}</IconButton>
}

export default DeleteDocument;
