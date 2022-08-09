import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import { Link as RouterLink } from 'react-router-dom';
import { EditorDocument } from '../slices/app';
import ArticleIcon from '@mui/icons-material/Article';
import Button from '@mui/material/Button';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { AppDispatch, RootState } from '../store';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../slices';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForever from '@mui/icons-material/DeleteForever';
import ShareIcon from '@mui/icons-material/Share';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDoneIcon from '@mui/icons-material/CloudDone';

const DocumentCard: React.FC<{ document: Omit<EditorDocument, "data"> }> = ({ document }) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.app.user);
  const cloudDocument = user?.documents?.find(d => d.id === document.id);
  const isUpToDate = cloudDocument?.updatedAt === document.updatedAt;

  const handleUpload = async () => {
    if (isUpToDate) return;
    const storedDocument: EditorDocument = JSON.parse(localStorage.getItem(document.id) || "{}");
    await dispatch(actions.app.uploadDocumentAsync(storedDocument));
  };

  const handleShare = async () => {
    if (!isUpToDate) {
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

  const handleDelete = () => {
    window.confirm("Are you sure you want to delete this document?") && dispatch(actions.app.deleteDocument(document.id));
  };

  const handleSave = () => {
    const blob = new Blob([JSON.stringify(document)], { type: "text/json" });
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

  return (
    <Card variant="outlined">
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>
        }
        action={<Button startIcon={<OpenInNewIcon />} component={RouterLink} to={`/edit/${document.id}`}>Open</Button>}
        title={document.name}
        subheader={new Date(document.createdAt).toLocaleDateString()}
      />
      <CardActions>
        <Button size="small" startIcon={<DeleteForever color="error" />} onClick={handleDelete}>
          Delete
        </Button>
        <IconButton size="medium" aria-label="Download" sx={{ ml: "auto !important" }} color="inherit" onClick={handleSave}>
          <DownloadIcon />
        </IconButton>
        {user && <>
          <IconButton size="medium" aria-label="Share" color="inherit" onClick={handleShare}>
            <ShareIcon />
          </IconButton>
          <IconButton size="medium" aria-label="Share" color="inherit" onClick={handleUpload}>
            {isUpToDate ? <CloudDoneIcon color='success' /> : <CloudUploadIcon />}
          </IconButton>
        </>}
      </CardActions>
    </Card>
  );
}

export default DocumentCard;