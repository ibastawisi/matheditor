import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import { Link as RouterLink } from 'react-router-dom';
import { EditorDocument, UserDocument } from '../slices/app';
import ArticleIcon from '@mui/icons-material/Article';
import { AppDispatch, RootState } from '../store';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../slices';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForever from '@mui/icons-material/DeleteForever';
import ShareIcon from '@mui/icons-material/Share';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
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

const DocumentCard: React.FC<{ document: Omit<EditorDocument, "data">, variant: 'local' | 'cloud' | 'public' }> = ({ document, variant }) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.app.user);
  const cloudDocument = user?.documents?.find(d => d.id === document.id);
  const isUpToDate = cloudDocument?.updatedAt === document.updatedAt;

  const handleUpload = async () => {
    if (isUpToDate) return;
    const storedDocument: EditorDocument = await documentDB.getByID(document.id);
    await dispatch(actions.app.uploadDocumentAsync(storedDocument));
  };

  const handleShare = async () => {
    if (variant === "local" && !isUpToDate) {
      await handleUpload();
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
    link.remove()
  };

  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
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
      handleClose();
    } catch (err) {
      dispatch(actions.app.announce({ message: "Can't update document data" }));
      handleClose();
    }
  };

  const togglePublic = async (document: UserDocument) => {
    try {
      const data = {
        ...document,
        isPublic: !document.isPublic,
      };
      dispatch(actions.app.uploadDocumentAsync(data as EditorDocument));
      dispatch(actions.app.loadDocumentsAsync());
    } catch (err) {
      dispatch(actions.app.announce({ message: "Can't update document data" }));
    }
  };

  return (
    <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
      <CardActionArea component={RouterLink} to={`/${variant === 'public' ? 'view' : 'edit'}/${document.id}`} sx={{ flexGrow: 1 }}>
        <CardHeader
          title={document.name}
          subheader={new Date(document.createdAt).toLocaleDateString()}
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>
          }
        />
      </CardActionArea>
      {variant !== 'public' && <CardActions>
        <IconButton size="small" aria-label="Rename" onClick={handleOpen}>
          <DriveFileRenameOutlineIcon />
        </IconButton>
        <Dialog open={open} onClose={handleClose}>
          <form onSubmit={handleRename}>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogContent >
              <TextField margin="normal" size="small" fullWidth id="name" value={formData.name} onChange={updateFormData} label="Document Name" name="name" autoFocus />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type='submit' onClick={handleRename}>Save</Button>
            </DialogActions>
          </form>
        </Dialog>

        <IconButton size="small" aria-label="Delete" color="error" onClick={handleDelete}>
          <DeleteForever />
        </IconButton>
        <IconButton sx={{ ml: "auto !important" }} size="small" aria-label="Upload" color={isUpToDate ? "success" : "default"} onClick={handleUpload} disabled={!user || variant === "cloud"}>
          {variant === "local" ? isUpToDate ? <CloudDoneIcon /> : <CloudUploadIcon /> : null}
        </IconButton>
        <IconButton size="small" aria-label="Share" onClick={handleShare} disabled={!user}>
          <ShareIcon />
        </IconButton>
        <IconButton size="small" aria-label="Download" onClick={handleSave}>
          <DownloadIcon />
        </IconButton>
        {variant === "cloud" && <IconButton size="small" aria-label="Show on public profile"
          color={document.isPublic ? "success" : "default"} onClick={() => togglePublic(document)}>
          <PublicIcon />
        </IconButton>}
      </CardActions>}
    </Card>
  );
}

export default DocumentCard;