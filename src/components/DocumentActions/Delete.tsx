"use client"
import { useDispatch, actions } from "@/store";
import { UserDocument } from "@/types";
import { DeleteForever } from "@mui/icons-material";
import { IconButton, ListItemIcon, ListItemText, MenuItem } from "@mui/material";

const DeleteDocument: React.FC<{ userDocument: UserDocument, variant?: 'menuitem' | 'iconbutton', closeMenu?: () => void }> = ({ userDocument, variant = 'iconbutton', closeMenu }) => {
  const dispatch = useDispatch();
  const localDocument = userDocument.local;
  const cloudDocument = userDocument.cloud;
  const isLocal = !!localDocument;
  const id = userDocument.id;
  const name = localDocument?.name || cloudDocument?.name || "This Document";

  const handleDelete = async () => {
    if(closeMenu) closeMenu();
    dispatch(actions.alert(
      {
        title: `Delete ${isLocal ? "Local" : "Cloud"} Document`,
        content: `Are you sure you want to delete ${name}?`,
        action: isLocal ?
          `dispatch(actions.deleteLocalDocument("${id}"))` :
          `dispatch(actions.deleteCloudDocument("${id}"))`
      }
    ));
  };

  if (variant === 'menuitem') return (
    <MenuItem onClick={handleDelete}>
      <ListItemIcon>
        <DeleteForever />
      </ListItemIcon>
      <ListItemText>Delete</ListItemText>
    </MenuItem>
  );
  return <IconButton aria-label="Delete Document" onClick={handleDelete} size="small"><DeleteForever /></IconButton>
}

export default DeleteDocument;
