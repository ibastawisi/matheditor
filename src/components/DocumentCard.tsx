import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import { Link as RouterLink } from 'react-router-dom';
import { EditorDocument } from '../slices/app';
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
import CardActionArea from '@mui/material/CardActionArea';

const DocumentCard: React.FC<{ document: Omit<EditorDocument, "data">, variant: 'local' | 'cloud' }> = ({ document, variant }) => {
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
        return localStorage.getItem(document.id);
      case "cloud":
        const response = await dispatch(actions.app.getDocumentAsync(document.id));
        const { payload, error } = response as any;
        if (!error) return JSON.stringify(payload);
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

  return (
    <Card variant="outlined">
      <CardActionArea component={RouterLink} to={`/edit/${document.id}`}>
        <CardHeader
          title={document.name}
          subheader={new Date(document.createdAt).toLocaleDateString()}
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>
          }
        />
      </CardActionArea>
      <CardActions>
        <IconButton size="small" aria-label="Delete" color="error" onClick={handleDelete}>
          <DeleteForever />
        </IconButton>
        <IconButton sx={{ ml: "auto !important" }} size="small" aria-label="Upload" color={isUpToDate ? "success" : "default"} onClick={handleUpload} disabled={!user || variant === "cloud"}>
          {isUpToDate ? <CloudDoneIcon /> : <CloudUploadIcon />}
        </IconButton>
        <IconButton size="small" aria-label="Share" onClick={handleShare} disabled={!user}>
          <ShareIcon />
        </IconButton>
        <IconButton size="small" aria-label="Download" onClick={handleSave}>
          <DownloadIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}

export default DocumentCard;