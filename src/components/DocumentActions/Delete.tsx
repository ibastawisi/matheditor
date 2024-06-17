"use client"
import { useDispatch, actions } from "@/store";
import { UserDocument } from "@/types";
import { Delete, DeleteForever } from "@mui/icons-material";
import { IconButton, ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import { v4 as uuid } from "uuid";

const DeleteDocument: React.FC<{ userDocument: UserDocument, variant?: 'menuitem' | 'iconbutton', closeMenu?: () => void }> = ({ userDocument, variant = 'iconbutton', closeMenu }) => {
  const dispatch = useDispatch();
  const localDocument = userDocument.local;
  const cloudDocument = userDocument.cloud;
  const isLocal = !!localDocument;
  const isCloud = !!cloudDocument;
  const isLastCopy = (isLocal && !isCloud) || (isCloud && !isLocal);
  const id = userDocument.id;
  const name = localDocument?.name || cloudDocument?.name || "This Document";

  const handleDelete = async () => {
    if (closeMenu) closeMenu();
    const alert = {
      title: `Delete ${isLocal ? "Local" : "Cloud"} Document`,
      content: `Are you sure you want to delete ${name}?`,
      actions: [
        { label: "Cancel", id: uuid() },
        { label: "Delete", id: uuid() },
      ]
    };
    const response = await dispatch(actions.alert(alert));
    if (response.payload === alert.actions[1].id) {
      dispatch(isLocal ? actions.deleteLocalDocument(id) : actions.deleteCloudDocument(id));
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
