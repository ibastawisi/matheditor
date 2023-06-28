import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { EditorDocument } from '../slices/app';
import ArticleIcon from '@mui/icons-material/Article';
import { AppDispatch, RootState } from '../store';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../slices';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForever from '@mui/icons-material/DeleteForever';
import ShareIcon from '@mui/icons-material/Share';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import CardActionArea from '@mui/material/CardActionArea';
import documentDB from '../db';
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
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import MobileFriendlyIcon from '@mui/icons-material/MobileFriendly';
import LinkIcon from '@mui/icons-material/Link';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import CloudIcon from '@mui/icons-material/Cloud';

const DocumentCard: React.FC<{ document: Omit<EditorDocument, "data">, variant: 'local' | 'cloud' | 'public' }> = ({ document, variant }) => {
  const user = useSelector((state: RootState) => state.app.user);
  const cloudDocument = user?.documents?.find(d => d.id === document.id);
  const isUploaded = !!cloudDocument || variant === "public";
  const isUpToDate = cloudDocument?.updatedAt === document.updatedAt;
  const isPublic = cloudDocument?.isPublic || variant === "public" && document.isPublic;

  return (
    <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
      <CardActionArea component={RouterLink} to={`/${variant === 'public' ? 'view' : 'edit'}/${document.id}`} sx={{ flexGrow: 1 }}>
        <CardHeader
          title={document.name}
          subheader={new Date(document.createdAt).toLocaleDateString()}
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>}
        />
      </CardActionArea>
      <CardActions>
        <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }}
          icon={variant === "local" ? <MobileFriendlyIcon /> : <CloudIcon />}
          label={variant === "local" ? "Local" : "Cloud"}
        />
        {isUploaded && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }}
          icon={isPublic ? <PublicIcon /> : <LinkIcon />}
          label={isPublic ? "Public" : "Shared"}
        />}
        {isUploaded && variant === "local" && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={isUpToDate ? <CloudDoneIcon /> : <CloudSyncIcon />} label={isUpToDate ? "Up to date" : "Out of Sync"} />}
        {variant !== 'public' && <DocumentActionMenu document={document} variant={variant} />}
      </CardActions>
    </Card>
  );
}

function DocumentActionMenu({ document, variant }: { document: Omit<EditorDocument, "data">, variant: 'local' | 'cloud' | 'public' }): JSX.Element {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const closeMenu = () => {
    setAnchorEl(null);
  };

  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.app.user);
  const cloudDocument = user?.documents?.find(d => d.id === document.id);
  const isUploaded = !!cloudDocument;
  const isUpToDate = cloudDocument?.updatedAt === document.updatedAt;
  const isPublic = cloudDocument?.isPublic;

  const navigate = useNavigate();

  const handleUpload = async () => {
    closeMenu();
    if (!user) return dispatch(actions.app.announce({ message: "Please login to use cloud storage" }));
    if (isUpToDate) return dispatch(actions.app.announce({ message: "Document is up to date" }));
    const storedDocument: EditorDocument = await documentDB.getByID(document.id);
    const updatedDocument: EditorDocument = {
      ...storedDocument,
      isPublic: cloudDocument?.isPublic
    }
    return await dispatch(actions.app.uploadDocumentAsync(updatedDocument));
  };

  const handleShare = async () => {
    closeMenu();
    if (!user) return dispatch(actions.app.announce({ message: "Please login to use cloud storage" }));
    if (variant === "local" && !isUpToDate) {
      const result = await handleUpload();
      if (result.type === actions.app.uploadDocumentAsync.rejected.type) return;
    };

    const shareData = {
      title: document.name,
      url: window.location.origin + "/view/" + document.id
    }
    try {
      await navigator.share(shareData)
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      dispatch(actions.app.announce({ message: "Link copied to clipboard" }));
    }
  };

  const handleDelete = async () => {
    closeMenu();
    dispatch(actions.app.alert(
      {
        title: `Delete ${variant} document`,
        content: `Are you sure you want to delete ${document.name}?`,
        action: variant === "local" ?
          `dispatch(actions.app.deleteDocument("${document.id}"))` :
          `dispatch(actions.app.deleteDocumentAsync("${document.id}"))`
      }
    ));
  };

  const getPayload = async () => {
    switch (variant) {
      case "local":
        const localDocument = await documentDB.getByID(document.id);
        if (localDocument) return JSON.stringify(localDocument);
        break;
      case "cloud":
        const response = await dispatch(actions.app.getDocumentAsync(document.id));
        const { payload, error } = response as any;
        if (!error) return JSON.stringify(payload);
        break;
    }
  }

  const handleSave = async () => {
    closeMenu();
    const payload = await getPayload();
    if (!payload) return dispatch(actions.app.announce({ message: "Can't find document data" }));
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

  const togglePublic = async () => {
    closeMenu();
    try {
      const data = {
        ...document,
        isPublic: !isPublic,
      };
      await dispatch(actions.app.uploadDocumentAsync(data as EditorDocument));
      dispatch(actions.app.announce({ message: `Document ${isPublic ? "unpublished" : "published"} successfully` }));
      dispatch(actions.app.loadDocumentsAsync());
    } catch (err) {
      dispatch(actions.app.announce({ message: "Can't update document data" }));
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
    const payload = await getPayload();
    if (!payload) return dispatch(actions.app.announce({ message: "Can't find document data" }));

    try {
      const data = {
        ...JSON.parse(payload),
        ...formData,
        updatedAt: new Date().toISOString()
      }
      dispatch(actions.app.saveDocument(data));
      dispatch(actions.app.loadDocumentsAsync());
      closeRenameDialog();
    } catch (err) {
      dispatch(actions.app.announce({ message: "Can't update document data" }));
      closeRenameDialog();
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
      <Dialog open={renameDialogOpen} onClose={closeRenameDialog}>
        <form onSubmit={handleRename}>
          <DialogTitle>Rename Document</DialogTitle>
          <DialogContent >
            <TextField margin="normal" size="small" fullWidth id="name" value={formData.name} onChange={updateFormData} label="Document Name" name="name" autoFocus />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeRenameDialog}>Cancel</Button>
            <Button type='submit' onClick={handleRename}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>
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
        <MenuItem onClick={openRenameDialog}>
          <ListItemIcon>
            <DriveFileRenameOutlineIcon />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleSave}>
          <ListItemIcon>
            <DownloadIcon />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleFork}>
          <ListItemIcon>
            <FileCopyIcon />
          </ListItemIcon>
          <ListItemText>Fork</ListItemText>
        </MenuItem>

        <Divider />

        {variant === "local" && isUploaded && !isUpToDate && <MenuItem onClick={handleUpload}>
          <ListItemIcon>
            <CloudSyncIcon />
          </ListItemIcon>
          <ListItemText>
            Sync
          </ListItemText>
        </MenuItem>}
        <MenuItem onClick={handleShare}>
          <ListItemIcon>
            <ShareIcon />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        {isUploaded && <MenuItem onClick={togglePublic}>
          <ListItemIcon>
            {isPublic ? <PublicOffIcon /> : <PublicIcon />}
          </ListItemIcon>
          <ListItemText>{isPublic ? "Unpublish" : "Publish"}</ListItemText>
        </MenuItem>}

        <Divider />

        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteForever />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}


export default DocumentCard;