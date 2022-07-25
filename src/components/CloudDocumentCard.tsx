import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import { useNavigate } from 'react-router-dom';
import { EditorDocument } from '../slices/app';
import ArticleIcon from '@mui/icons-material/Article';
import Button from '@mui/material/Button';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { AppDispatch, RootState } from '../store';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../slices';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import { DeleteForever } from '@mui/icons-material';

import ShareIcon from '@mui/icons-material/Share';
import { deleteDocument, getDocument } from '../services';

const CloudDocumentCard: React.FC<{ document: Omit<EditorDocument, "data"> }> = ({ document }) => {
  const dispatch = useDispatch<AppDispatch>();
  const documents = useSelector((state: RootState) => state.app.documents);
  const navigate = useNavigate();

  const handleShare = async () => {
    // dispatch(actions.app.announce({ message: "Generating sharable link" }));
    // try {
    //   await Service.post(document.id, JSON.stringify(document));
    // } catch (e) {
    //   dispatch(actions.app.announce({ message: "Failed to generate sharable link" }));
    //   return;
    // }
    const shareData = {
      title: document.name,
      url: window.location.origin + "/new/" + document.id
    }
    try {
      await navigator.share(shareData)
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      dispatch(actions.app.announce({ message: "Link copied to clipboard" }));
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      await deleteDocument(document.id);
      dispatch(actions.app.deleteUserDocument(document.id));

    }
  };

  const openDocument = async () => {
    const data = await getDocument(document.id);
    dispatch(actions.app.loadDocument(data));
    navigate(`/edit/${document.id}`);
  }
  const handleOpen = async () => {
    if (documents.includes(document.id)) {
      window.confirm("This document is available in local storage, replace it with the cloud version?") && openDocument();
    } else {
      openDocument();
    }

  }

  const handleSave = async () => {
    const data = await getDocument(document.id);

    const blob = new Blob([JSON.stringify(data)], { type: "text/json" });
    const link = window.document.createElement("a");

    link.download = data.name + ".me";
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

  if (!document) return null;

  return (
    <Card variant="outlined">
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>
        }
        action={<Button startIcon={<OpenInNewIcon />} onClick={handleOpen}>Open</Button>}
        title={document.name}
        subheader={<>
          {new Date(document.updatedAt).toLocaleString()}
        </>}
      />
      <CardActions>
        <Button size="small" startIcon={<DeleteForever color="error" />} onClick={handleDelete}>
          Delete
        </Button>
        <IconButton size="medium" aria-label="Download" sx={{ ml: "auto !important" }} color="inherit" onClick={handleSave}>
          <DownloadIcon />
        </IconButton>
        <IconButton size="medium" aria-label="Share" color="inherit" onClick={handleShare}>
          <ShareIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}

export default CloudDocumentCard;