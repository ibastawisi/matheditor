import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { EditorDocument } from '../store/types';
import { AppDispatch, RootState, actions } from '../store';
import { useDispatch, useSelector } from 'react-redux';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForever from '@mui/icons-material/DeleteForever';
import ShareIcon from '@mui/icons-material/Share';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ListItemButton from '@mui/material/ListItemButton';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import HtmlIcon from '@mui/icons-material/Html';
import theme from '../lexical/theme.css?inline';
import stickyStyles from '../lexical/nodes/StickyNode/StickyNode.css?inline';
import { generateMarkdown, generateHtml } from '../lexical/utils/generateExportContent';
import { MarkdownIcon } from './DocumentCard';

export type options = ('rename' | 'download' | 'fork' | 'share' | 'publish' | 'upload' | 'delete' | 'export')[];
type DocumentActionMenuProps = {
  document: Omit<EditorDocument, 'data'>;
  variant: 'local' | 'cloud' | 'public' | 'admin';
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
  const user = useSelector((state: RootState) => state.app.user);
  const cloudDocument = user?.documents?.find(d => d.id === document.id);
  const isUploaded = !!cloudDocument;
  const isUpToDate = cloudDocument?.updatedAt === document.updatedAt;
  const isPublic = cloudDocument?.isPublic;

  const navigate = useNavigate();

  const handleCreate = async () => {
    closeMenu();
    if (!user) return dispatch(actions.app.announce({ message: "Please login to use cloud storage" }));
    const storedDocument: EditorDocument = await documentDB.getByID(document.id);
    return await dispatch(actions.app.createDocumentAsync(storedDocument));
  };

  const handleUpdate = async () => {
    closeMenu();
    if (!user) return dispatch(actions.app.announce({ message: "Please login to use cloud storage" }));
    if (isUpToDate) return dispatch(actions.app.announce({ message: "Document is up to date" }));
    const storedDocument: EditorDocument = await documentDB.getByID(document.id);
    // const updatedDocument: EditorDocument = {
    //   ...storedDocument,
    //   isPublic: cloudDocument?.isPublic
    // };
    return await dispatch(actions.app.updateDocumentAsync({ id: document.id, partial: storedDocument }));
  };

  const handleShare = async () => {
    closeMenu();
    if (variant != 'public' && !user) return dispatch(actions.app.announce({ message: "Please login to use cloud storage" }));

    if (variant === "local" && !isUploaded) {
      dispatch(actions.app.announce({ message: "Saving document to the cloud" }));
      const result = await handleCreate();
      if (result.type === actions.app.createDocumentAsync.rejected.type) return;
    };

    if (variant === "local" && isUpToDate && !isUpToDate) {
      dispatch(actions.app.announce({ message: "Updating document in the cloud" }));
      const result = await handleUpdate();
      if (result.type === actions.app.updateDocumentAsync.rejected.type) return;
    };

    const shareData = {
      title: document.name,
      url: window.location.origin + "/view/" + document.id
    };
    try {
      await navigator.share(shareData);
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
  };

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
      await dispatch(actions.app.updateDocumentAsync({ id: document.id, partial: { isPublic: !isPublic } }));
      dispatch(actions.app.announce({ message: `Document ${isPublic ? "unpublished" : "published"} successfully` }));
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
    closeRenameDialog();
    try {
      const partial: Partial<EditorDocument> = {
        ...formData,
        updatedAt: new Date().toISOString()
      };
      if (variant === "local") {
        dispatch(actions.app.updateDocument({ id: document.id, partial }));
      }
      if (isUploaded) {
        await dispatch(actions.app.updateDocumentAsync({ id: document.id, partial }));
      }
    } catch (err) {
      dispatch(actions.app.announce({ message: "Can't update document data" }));
    }
  };

  const handleFork = () => {
    closeMenu();
    navigate(`/new/${document.id}`);
  };

  const [exportOpen, setExportOpen] = useState(false);
  const toggleExportMenu = () => setExportOpen(!exportOpen);

  const exportToMarkdown = async () => {
    toggleExportMenu();
    closeMenu();
    const payload = await getPayload();
    if (!payload) return dispatch(actions.app.announce({ message: "Can't find document data" }));
    const { data } = JSON.parse(payload);
    const markdown = await generateMarkdown(data);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const link = window.document.createElement("a");
    link.download = document.name + ".md";
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/markdown", link.download, link.href].join(":");
    const evt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(evt);
    link.remove();

  };

  const exportToHtml = async () => {
    toggleExportMenu();
    closeMenu();
    const payload = await getPayload();
    if (!payload) return dispatch(actions.app.announce({ message: "Can't find document data" }));
    const { data } = JSON.parse(payload);
    const htmlString = await generateHtml(data);
    const html = addHead(htmlString);
    const blob = new Blob([html], { type: "text/html" });
    const link = window.document.createElement("a");
    link.download = document.name + ".html";
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/html", link.download, link.href].join(":");
    const evt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(evt);
    link.remove();
  };

  const addHead = (html: string) => {
    const head = `
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta name="title" content="${document.name}" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
      <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
      <style>
        html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;box-sizing:border-box;-webkit-text-size-adjust:100%;}
        *,*::before,*::after{box-sizing:inherit;}
        body{font-family:"Roboto","Helvetica","Arial",sans-serif;font-weight:400;font-size:1rem;line-height:1.5;letter-spacing:0.00938em;max-width:1200px;margin:2rem auto;padding:0 1.5rem;}
        img{max-width:100%;background-color:white;}
        .ML__mathlive{padding:4px;}
        @font-face{font-family:Virgil;src:url(https://unpkg.com/@excalidraw/excalidraw/dist/excalidraw-assets/Virgil.woff2);}
        @font-face{font-family:Cascadia;src:url(https://unpkg.com/@excalidraw/excalidraw/dist/excalidraw-assets/Cascadia.woff2);}
        ${theme}
        ${stickyStyles}
      </style>
    </head>
    `;
    return `<html>${head}<body>${html}</body></html>`;
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
        {options.includes('export') &&
          <MenuItem onClick={toggleExportMenu}>
            <ListItemIcon>
              <ImportExportIcon />
            </ListItemIcon>
            <ListItemText primary="Export" />
            {exportOpen ? <ExpandLess sx={{ ml: 2 }} /> : <ExpandMore sx={{ ml: 2 }} />}
          </MenuItem>
        }
        {options.includes('export') &&
          <Collapse in={exportOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton sx={{ pl: 4 }} onClick={exportToMarkdown}>
                <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
                  <MarkdownIcon />
                </ListItemIcon>
                <ListItemText primary="Markdown" />
              </ListItemButton>
              <ListItemButton sx={{ pl: 4 }} onClick={exportToHtml}>
                <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
                  <HtmlIcon />
                </ListItemIcon>
                <ListItemText primary="HTML" />
              </ListItemButton>
            </List>
          </Collapse>
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
          isUploaded &&
          <MenuItem onClick={togglePublic}>
            <ListItemIcon>
              {isPublic ? <PublicOffIcon /> : <PublicIcon />}
            </ListItemIcon>
            <ListItemText>{isPublic ? "Unpublish" : "Publish"}</ListItemText>
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