"use client"
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DocumentVariant, EditorDocument } from '@/types';
import { AppDispatch, RootState, actions } from '@/store';
import { useDispatch, useSelector } from 'react-redux';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForever from '@mui/icons-material/DeleteForever';
import ShareIcon from '@mui/icons-material/Share';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import PublicIcon from '@mui/icons-material/Public';
import PublicOffIcon from '@mui/icons-material/PublicOff';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import CodeIcon from '@mui/icons-material/Code';
import SvgIcon from '@mui/material/SvgIcon';

export const MarkdownIcon = () => <SvgIcon viewBox="0 0 640 512" fontSize='small'>
  <path d="M593.8 59.1H46.2C20.7 59.1 0 79.8 0 105.2v301.5c0 25.5 20.7 46.2 46.2 46.2h547.7c25.5 0 46.2-20.7 46.1-46.1V105.2c0-25.4-20.7-46.1-46.2-46.1zM338.5 360.6H277v-120l-61.5 76.9-61.5-76.9v120H92.3V151.4h61.5l61.5 76.9 61.5-76.9h61.5v209.2zm135.3 3.1L381.5 256H443V151.4h61.5V256H566z" />
</SvgIcon>;


export type options = ('rename' | 'download' | 'fork' | 'share' | 'publish' | 'upload' | 'delete' | 'embed')[];
type DocumentActionMenuProps = {
  document: Omit<EditorDocument, 'data'>;
  variant: DocumentVariant;
  options: options;
};

function DocumentActionMenu({ document, variant, options }: DocumentActionMenuProps): JSX.Element {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const closeMenu = () => {
    setAnchorEl(null);
  };

  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user);
  const documents = useSelector((state: RootState) => state.documents);
  const cloudDocument = documents.filter(d => d.variant === "cloud").find(d => d.id === document.id);
  const isUploaded = !!cloudDocument;
  const isUpToDate = cloudDocument?.updatedAt === document.updatedAt;
  const isPublished = cloudDocument?.published;

  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  const handleCreate = async () => {
    closeMenu();
    if (!user) return dispatch(actions.announce({ message: "Please login to use cloud storage" }));
    const response = await dispatch(actions.getLocalDocument(document.id));
    if (response.type === actions.getLocalDocument.rejected.type) return dispatch(actions.announce({ message: "Couldn't find local document" }));
    const localDocument = response.payload as EditorDocument;
    return await dispatch(actions.createCloudDocument(localDocument));
  };

  const handleUpdate = async () => {
    closeMenu();
    if (!user) return dispatch(actions.announce({ message: "Please login to use cloud storage" }));
    if (isUpToDate) return dispatch(actions.announce({ message: "Document is up to date" }));
    const response = await dispatch(actions.getLocalDocument(document.id));
    if (response.type === actions.getLocalDocument.rejected.type) return dispatch(actions.announce({ message: "Couldn't find local document" }));
    const localDocument = response.payload as EditorDocument;
    return await dispatch(actions.updateCloudDocument({ id: document.id, partial: localDocument }));
  };

  const ensureUpToDate = async () => {
    if (variant != 'published' && !user) {
      dispatch(actions.announce({ message: "Please login to use cloud storage" }));
      return false;
    }
    if (variant === "local" && !isUploaded) {
      dispatch(actions.announce({ message: "Saving document to the cloud" }));
      const result = await handleCreate();
      if (result.type === actions.createCloudDocument.rejected.type) return false;
    };
    if (variant === "local" && isUpToDate && !isUpToDate) {
      dispatch(actions.announce({ message: "Updating document in the cloud" }));
      const result = await handleUpdate();
      if (result.type === actions.updateCloudDocument.rejected.type) return false;
    };
    return true;
  };

  const handleShare = async () => {
    closeMenu();
    const result = await ensureUpToDate();
    if (!result) return;
    const shareData = {
      title: document.name,
      url: window.location.origin + "/view/" + document.id
    };
    try {
      await navigator.share(shareData);
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      dispatch(actions.announce({ message: "Link copied to clipboard" }));
    }
  };

  const handleEmbed = async () => {
    closeMenu();
    const result = await ensureUpToDate();
    if (!result) return;
    const iframe = `<iframe src="${window.location.origin}/embed/${document.id}" width="100%" height="100%" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(iframe);
    dispatch(actions.announce({ message: "Embed code copied to clipboard" }));
  };

  const handleDelete = async () => {
    closeMenu();
    dispatch(actions.alert(
      {
        title: `Delete ${variant} document`,
        content: `Are you sure you want to delete ${document.name}?`,
        action: variant === "local" ?
          `dispatch(actions.deleteLocalDocument("${document.id}"))` :
          `dispatch(actions.deleteCloudDocument("${document.id}"))`
      }
    ));
  };

  const getPayload = async () => {
    switch (variant) {
      case "local":
        {
          const response = await dispatch(actions.getLocalDocument(document.id));
          if (response.type === actions.getLocalDocument.fulfilled.type) {
            return JSON.stringify(response.payload);
          }
          break;
        }
      default:
        {
          const response = await dispatch(actions.getCloudDocument(document.id));
          if (response.type === actions.getCloudDocument.fulfilled.type) {
            return JSON.stringify(response.payload);
          }
          break;
        }
    }
  };

  const handleSave = async () => {
    closeMenu();
    const payload = await getPayload();
    if (!payload) return dispatch(actions.announce({ message: "Can't find document data" }));
    const blob = new Blob([payload], { type: "text/json" });
    const link = window.document.createElement("a");

    link.download = document.name + ".me";
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

  const togglePublished = async () => {
    closeMenu();
    const result = await ensureUpToDate();
    if (!result) return;
    const response = await dispatch(actions.updateCloudDocument({ id: document.id, partial: { published: !isPublished } }));
    if (response.type === actions.updateCloudDocument.fulfilled.type) {
      dispatch(actions.announce({ message: `Document ${isPublished ? "unpublished" : "published"} successfully` }));
    }
  };

  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);

  const openRenameDialog = () => {
    closeMenu();
    setRenameDialogOpen(true);
  };

  const closeRenameDialog = () => {
    setRenameDialogOpen(false);
  };

  const [formData, setFormData] = useState({ name: document.name });

  const updateFormData = (event: any) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRename = async (event: any) => {
    event.preventDefault();
    closeRenameDialog();
    const partial: Partial<EditorDocument> = {
      ...formData,
      updatedAt: new Date().toISOString()
    };
    if (variant === "local") {
      try {
        dispatch(actions.updateLocalDocument({ id: document.id, partial }));
      } catch (err) {
        dispatch(actions.announce({ message: "Something went wrong" }));
      }
    }
    if (isUploaded) {
      await dispatch(actions.updateCloudDocument({ id: document.id, partial }));
    }
  };

  const handleFork = () => {
    closeMenu();
    navigate(`/new/${document.id}`);
  };

  return (
    <>
      <IconButton
        id="document-action-button"
        aria-controls={open ? 'document-action-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label='Document Actions'
        onClick={openMenu}
        size="small"
        sx={{ ml: "auto" }}
      >
        <MoreVertIcon />
      </IconButton>
      {options.includes('rename') && <Dialog open={renameDialogOpen} onClose={closeRenameDialog}>
        <form onSubmit={handleRename}>
          <DialogTitle>Rename Document</DialogTitle>
          <DialogContent>
            <TextField margin="normal" size="small" fullWidth id="name" value={formData.name} onChange={updateFormData} label="Document Name" name="name" autoFocus />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeRenameDialog}>Cancel</Button>
            <Button type='submit' onClick={handleRename}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>
      }
      <Menu
        id="document-action-menu"
        aria-labelledby="document-action-button"
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {options.includes('rename') && <MenuItem onClick={openRenameDialog}>
          <ListItemIcon>
            <DriveFileRenameOutlineIcon />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        }
        {options.includes('download') &&
          <MenuItem onClick={handleSave}>
            <ListItemIcon>
              <DownloadIcon />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
        }
        {options.includes('embed') &&
          <MenuItem onClick={handleEmbed}>
            <ListItemIcon>
              <CodeIcon />
            </ListItemIcon>
            <ListItemText>Embed</ListItemText>
          </MenuItem>
        }
        {options.includes('fork') && <MenuItem onClick={handleFork}>
          <ListItemIcon>
            <FileCopyIcon />
          </ListItemIcon>
          <ListItemText>Fork</ListItemText>
        </MenuItem>
        }
        {options.includes('upload') &&
          variant === "local" && !isUpToDate &&
          <MenuItem onClick={isUploaded ? handleUpdate : handleCreate}>
            <ListItemIcon>
              {isUploaded ? <CloudSyncIcon /> : <CloudUploadIcon />}
            </ListItemIcon>
            <ListItemText>
              {isUploaded ? "Update Cloud" : "Save to Cloud"}
            </ListItemText>
          </MenuItem>
        }
        {options.includes('share') &&
          <MenuItem onClick={handleShare}>
            <ListItemIcon>
              <ShareIcon />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>
        }
        {options.includes('publish') &&
          <MenuItem onClick={togglePublished}>
            <ListItemIcon>
              {isPublished ? <PublicOffIcon /> : <PublicIcon />}
            </ListItemIcon>
            <ListItemText>{isPublished ? "Unpublish" : "Publish"}</ListItemText>
          </MenuItem>
        }
        {options.includes('delete') &&
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteForever />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        }
      </Menu>
    </>
  );
}

export default DocumentActionMenu;