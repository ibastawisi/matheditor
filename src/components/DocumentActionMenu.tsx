"use client"
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckHandleResponse, EditorDocument, UserDocument, isCloudDocument, isLocalDocument } from '@/types';
import { useDispatch, useSelector, actions } from '@/store';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForever from '@mui/icons-material/DeleteForever';
import ShareIcon from '@mui/icons-material/Share';
import { useCallback, useState } from 'react';
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
import SettingsIcon from '@mui/icons-material/Settings';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { debounce } from '@mui/material/utils';
import FormControl from '@mui/material/FormControl';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';

export type options = ('edit' | 'download' | 'fork' | 'share' | 'publish' | 'upload' | 'delete' | 'embed')[];
type DocumentActionMenuProps = {
  document: UserDocument;
  options: options;
};

function DocumentActionMenu({ document, options }: DocumentActionMenuProps): JSX.Element {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const closeMenu = () => {
    setAnchorEl(null);
  };

  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const isLocal = isLocalDocument(document);
  const isCloud = isCloudDocument(document);
  const isOwner = isLocal || document.author.id === user?.id;
  const cloudDocument = useSelector(state => state.documents.filter(isCloudDocument).find(d => d.id === document.id));
  const isUploaded = isLocal && !!cloudDocument;
  const isUpToDate = isUploaded && document.updatedAt === cloudDocument.updatedAt;
  const isPublished = isCloud ? document.published : isUploaded ? cloudDocument.published : false;

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
    if (!user) {
      dispatch(actions.announce({ message: "Please login to use cloud storage" }));
      return false;
    }
    if (isLocal && !isUploaded) {
      dispatch(actions.announce({ message: "Saving document to the cloud" }));
      const result = await handleCreate();
      if (result.type === actions.createCloudDocument.rejected.type) return false;
    };
    if (isLocal && isUpToDate && !isUpToDate) {
      dispatch(actions.announce({ message: "Updating document in the cloud" }));
      const result = await handleUpdate();
      if (result.type === actions.updateCloudDocument.rejected.type) return false;
    };
    return true;
  };

  const handleDelete = async () => {
    closeMenu();
    dispatch(actions.alert(
      {
        title: `Delete ${document.variant} document`,
        content: `Are you sure you want to delete ${document.name}?`,
        action: isLocal ?
          `dispatch(actions.deleteLocalDocument("${document.id}"))` :
          `dispatch(actions.deleteCloudDocument("${document.id}"))`
      }
    ));
  };

  const getPayload = async () => {
    switch (document.variant) {
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

  const handleFork = () => {
    closeMenu();
    navigate(`/new/${document.handle || document.id}`);
  };

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const openEditDialog = () => {
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
  };

  const checkHandle = useCallback(debounce(async (resolve: (value: boolean) => void, value?: string) => {
    if (!value) return resolve(true);
    if (!navigator.onLine) return resolve(true);
    if ((isCloud || isUploaded) && value === document?.handle) return resolve(true);
    try {
      const response = await fetch(`/api/documents/check?handle=${value}`);
      const { data, error } = await response.json() as CheckHandleResponse;
      if (error) return resolve(false);
      return resolve(!!data);
    } catch (err) { return resolve(false) }
  }, 500), [document]);

  const validationSchema = yup.object({
    name: yup
      .string()
      .required('Name is required'),
    handle: yup
      .string()
      .min(3, 'Handle must be at least 3 characters')
      .matches(/^[a-zA-Z0-9-]*$/, 'Handle must only contain letters, numbers, and dashes')
      .test('is-online', 'Cannot change handle while offline', value => !value || value === document.handle || navigator.onLine)
      .test('is-cloud', 'Document is not saved to the cloud', value => !value || value === document.handle || isCloud || isUploaded)
      .test('is-unique', 'Handle is already taken', value => new Promise(resolve => checkHandle(resolve, value)))
  });

  const formik = useFormik({
    initialValues: {
      name: document.name,
      handle: document.handle || "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      closeEditDialog();
      const partial: Partial<UserDocument> = {};
      if (values.name !== document.name) {
        partial.name = values.name;
        partial.updatedAt = new Date().toISOString();
      }
      if (values.handle !== document.handle) {
        partial.handle = values.handle || null;
      }
      if (Object.keys(partial).length === 0) return;
      if (isLocal) {
        try {
          dispatch(actions.updateLocalDocument({ id: document.id, partial }));
        } catch (err) {
          dispatch(actions.announce({ message: "Something went wrong" }));
        }
      }
      if (isUploaded || isCloud) {
        await dispatch(actions.updateCloudDocument({ id: document.id, partial }));
      }
    },
  });

  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const openShareDialog = () => {
    closeMenu();
    setShareDialogOpen(true);
  };

  const closeShareDialog = () => {
    setShareDialogOpen(false);
  };

  const handleShare = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await ensureUpToDate();
    if (!result) return;
    const format = formData.get("format") as string;
    const handle = document.handle || document.id;
    const shareData = {
      title: document.name,
      url: `${window.location.origin}/${format}/${handle}`,
    };
    try {
      closeShareDialog();
      await navigator.share(shareData);
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      dispatch(actions.announce({ message: "Link copied to clipboard" }));
    }
  };

  return (
    <>
      {options.includes("edit") && <>
        <IconButton
          id="user-action-button"
          aria-label='User Actions'
          onClick={openEditDialog}
          size="small"
        >
          <SettingsIcon />
        </IconButton>
        <Dialog open={editDialogOpen} onClose={closeEditDialog} fullWidth maxWidth="xs">
          <form onSubmit={formik.handleSubmit} noValidate autoComplete="off">
            <DialogTitle>Edit Document</DialogTitle>
            <DialogContent sx={{ "& .MuiFormHelperText-root": { overflow: "hidden", textOverflow: "ellipsis" } }}>
              <TextField margin="normal" size="small" fullWidth
                id="name"
                label="Document Name"
                name="name"
                autoFocus
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={!!formik.errors.name}
                helperText={formik.errors.name}
              />
              <TextField margin="normal" size="small" fullWidth
                id="handle"
                label="Document Handle"
                name="handle"
                value={formik.values.handle}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={!!formik.errors.handle}
                helperText={formik.errors.handle ?? `https://matheditor.me/view/${formik.values.handle || document.id}`}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closeEditDialog}>Cancel</Button>
              <Button type='submit'>Save</Button>
            </DialogActions>
          </form>
        </Dialog>
      </>
      }

      <IconButton
        id="document-action-button"
        aria-controls={open ? 'document-action-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label='Document Actions'
        onClick={openMenu}
        size="small"
      >
        <MoreVertIcon />
      </IconButton>
      {options.includes('share') && <Dialog open={shareDialogOpen} onClose={closeShareDialog} fullWidth maxWidth="xs">
        <form onSubmit={handleShare}>
          <DialogTitle>Share Document</DialogTitle>
          <DialogContent>
            <FormControl>
              <RadioGroup row aria-label="share format" name="format" defaultValue="view">
                <FormControlLabel value="view" control={<Radio />} label="View" />
                <FormControlLabel value="embed" control={<Radio />} label="Embed" />
                <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
              </RadioGroup>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeShareDialog}>Cancel</Button>
            <Button type='submit'>Share</Button>
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
        {options.includes('download') &&
          <MenuItem onClick={handleSave}>
            <ListItemIcon>
              <DownloadIcon />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
        }
        {options.includes('share') &&
          <MenuItem onClick={openShareDialog}>
            <ListItemIcon>
              <ShareIcon />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
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
          isLocal && !isUpToDate &&
          <MenuItem onClick={isUploaded ? handleUpdate : handleCreate}>
            <ListItemIcon>
              {isUploaded ? <CloudSyncIcon /> : <CloudUploadIcon />}
            </ListItemIcon>
            <ListItemText>
              {isUploaded ? "Update Cloud" : "Save to Cloud"}
            </ListItemText>
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