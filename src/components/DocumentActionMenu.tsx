"use client"
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckHandleResponse, CloudDocument, EditorDocument, User, UserDocument } from '@/types';
import { useDispatch, useSelector, actions } from '@/store';
import { useCallback, useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import useFixedBodyScroll from '@/hooks/useFixedBodyScroll';
import { debounce } from '@mui/material/utils';
import { IconButton, Checkbox, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, FormControl, RadioGroup, FormControlLabel, Radio, Menu, MenuItem, ListItemIcon, ListItemText, FormHelperText, Typography, Tabs, Box, Tab, Slider, FormLabel, useMediaQuery } from '@mui/material';
import { Settings, Share, MoreVert, Download, FileCopy, CloudSync, CloudUpload, DeleteForever } from '@mui/icons-material';
import UsersAutocomplete from './UsersAutocomplete';
import { validate } from 'uuid';
import { useTheme } from '@mui/material/styles';

export type options = ('edit' | 'download' | 'fork' | 'share' | 'upload' | 'delete')[];
type DocumentActionMenuProps = {
  userDocument: UserDocument;
  options: options;
};

function DocumentActionMenu({ userDocument, options }: DocumentActionMenuProps): JSX.Element {
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
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocalDocument = !!localDocument;
  const isCloud = !!cloudDocument;
  const isLocalOnly = isLocalDocument && !isCloud;
  const isCloudOnly = !isLocalDocument && isCloud;
  const isUploaded = isLocalDocument && isCloud;
  const isUpToDate = isUploaded && localDocument.updatedAt === cloudDocument.updatedAt;
  const isPublished = isCloud && cloudDocument.published;
  const isAuthor = isCloud ? cloudDocument.author.id === user?.id : true
  const isCoauthor = isCloud ? cloudDocument.coauthors.some(u => u.id === user?.id) : false;
  const id = userDocument.id;
  const name = cloudDocument?.name ?? localDocument?.name ?? "Untitled Document";
  const handle = cloudDocument?.handle ?? localDocument?.handle ?? null;
  const localRevisions = useSelector(state => state.revisions);
  const localDocumentRevisions = localRevisions.filter(r => r.documentId === userDocument.id);
  const cloudDocumentRevisions = cloudDocument?.revisions ?? [];
  const isHeadLocalRevision = localDocumentRevisions.some(r => r.id === localDocument?.head);
  const isHeadCloudRevision = cloudDocumentRevisions.some(r => r.id === localDocument?.head);
  const isHeadOutOfSync = isUploaded && localDocument.head !== cloudDocument.head;

  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  const handleCreate = async () => {
    closeMenu();
    if (!user) return dispatch(actions.announce({ message: "Please login to use cloud storage", action: { label: "Login", onClick: "login()" } }));
    const localResponse = await dispatch(actions.getLocalDocument(id));
    if (localResponse.type === actions.getLocalDocument.rejected.type) return dispatch(actions.announce({ message: "Couldn't find local document" }));
    const editorDocument = localResponse.payload as EditorDocument;
    if (!isHeadLocalRevision) {
      const editorDocumentRevision = { id: editorDocument.head, documentId: editorDocument.id, createdAt: editorDocument.updatedAt, data: editorDocument.data };
      await dispatch(actions.createLocalRevision(editorDocumentRevision));
    }
    return dispatch(actions.createCloudDocument(editorDocument));
  };

  const handleUpdate = async () => {
    closeMenu();
    if (!user) return dispatch(actions.announce({ message: "Please login to use cloud storage", action: { label: "Login", onClick: "login()" } }));
    if (isUpToDate) return dispatch(actions.announce({ message: "Document is up to date" }));
    if (isHeadCloudRevision && isHeadOutOfSync) return dispatch(actions.updateCloudDocument({ id, partial: { head: localDocument.head, updatedAt: localDocument.updatedAt } }));
    const localResponse = await dispatch(actions.getLocalDocument(id));
    if (localResponse.type === actions.getLocalDocument.rejected.type) return dispatch(actions.announce({ message: "Couldn't find local document" }));
    const editorDocument = localResponse.payload as ReturnType<typeof actions.getLocalDocument.fulfilled>["payload"];
    if (!isHeadLocalRevision) {
      const editorDocumentRevision = { id: editorDocument.head, documentId: editorDocument.id, createdAt: editorDocument.updatedAt, data: editorDocument.data };
      await dispatch(actions.createLocalRevision(editorDocumentRevision));
    }
    return dispatch(actions.updateCloudDocument({ id, partial: editorDocument }));
  };

  const ensureUpToDate = async () => {
    if (isCloudOnly) return true;
    if (!user) {
      dispatch(actions.announce({ message: "Please login to use cloud storage", action: { label: "Login", onClick: "login()" } }));
      return false;
    }
    if (isLocalOnly) {
      dispatch(actions.announce({ message: "Saving document to the cloud" }));
      const result = await handleCreate();
      if (result.type === actions.createCloudDocument.rejected.type) return false;
    };
    if (isUploaded && !isUpToDate) {
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
        title: `Delete ${isLocalDocument ? "Local" : "Cloud"} Document`,
        content: `Are you sure you want to delete ${name}?`,
        action: isLocalDocument ?
          `dispatch(actions.deleteLocalDocument("${id}"))` :
          `dispatch(actions.deleteCloudDocument("${id}"))`
      }
    ));
  };

  const getEditorDocument = async () => {
    if (isLocalDocument) {
      const response = await dispatch(actions.getLocalDocument(id));
      if (response.type === actions.getLocalDocument.fulfilled.type) {
        const editorDocument = response.payload as ReturnType<typeof actions.getLocalDocument.fulfilled>["payload"];
        return editorDocument;
      }
    } else {
      const response = await dispatch(actions.getCloudDocument(id));
      if (response.type === actions.getCloudDocument.fulfilled.type) {
        const editorDocument = response.payload as ReturnType<typeof actions.getCloudDocument.fulfilled>["payload"];
        return editorDocument;
      }
    }
  };

  const handleSave = async () => {
    closeMenu();
    const editorDocument = await getEditorDocument();
    if (!editorDocument) return dispatch(actions.announce({ message: "Can't find document data" }));
    const blob = new Blob([JSON.stringify(editorDocument)], { type: "text/json" });
    const link = window.document.createElement("a");

    link.download = editorDocument.name + ".me";
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
    const response = await dispatch(actions.updateCloudDocument({ id, partial: { published: !isPublished } }));
    if (response.type === actions.updateCloudDocument.fulfilled.type) {
      dispatch(actions.announce({ message: `Document ${isPublished ? "unpublished" : "published"} successfully` }));
    }
  };

  const handleFork = () => {
    closeMenu();
    navigate(`/new/${handle || id}`);
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
    if ((isCloud || isUploaded) && value === handle) return resolve(true);
    try {
      const response = await fetch(`/api/documents/check?handle=${value}`);
      const { data, error } = await response.json() as CheckHandleResponse;
      if (error) return resolve(false);
      return resolve(!!data);
    } catch (err) { return resolve(false) }
  }, 500), [userDocument]);

  const validationSchema = yup.object({
    name: yup
      .string()
      .required('Name is required'),
    handle: yup
      .string()
      .min(3, 'Handle must be at least 3 characters')
      .strict().lowercase('Handle must be lowercase')
      .matches(/^[a-zA-Z0-9-]*$/, 'Handle must only contain letters, numbers, and dashes')
      .test('is-uuid', 'Handle cannot be a UUID', value => !value || !validate(value))
      .test('is-online', 'Cannot change handle while offline', value => !value || value === handle || navigator.onLine)
      .test('is-cloud', 'Document is not saved to the cloud', value => !value || value === handle || isCloud || isUploaded)
      .test('is-unique', 'Handle is already taken', value => new Promise(resolve => checkHandle(resolve, value)))
  });

  const formik = useFormik({
    initialValues: {
      name: name,
      handle: handle,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      closeEditDialog();
      const partial: Partial<EditorDocument> = {};
      if (values.name !== name) {
        partial.name = values.name;
        partial.updatedAt = new Date().toISOString();
      }
      if (values.handle !== handle) {
        partial.handle = values.handle || null;
      }
      if (Object.keys(partial).length === 0) return;
      if (isLocalDocument) {
        try {
          dispatch(actions.updateLocalDocument({ id, partial }));
        } catch (err) {
          dispatch(actions.announce({ message: "Something went wrong" }));
        }
      }
      if (isUploaded || isCloud) {
        await dispatch(actions.updateCloudDocument({ id, partial }));
      }
    },
  });

  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const openShareDialog = () => {
    setShareDialogOpen(true);
  };

  const closeShareDialog = () => {
    setShareDialogOpen(false);
  };

  const handleShare = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formdata = new FormData(event.currentTarget);
    const result = await ensureUpToDate();
    if (!result) return;
    const url = new URL(window.location.origin);
    url.pathname = `/${shareFormat}/${handle || id}`;
    if (shareFormat === "pdf") {
      const scale = formdata.get("scale") as string;
      const landscape = formdata.get("landscape") as string;
      const format = formdata.get("format") as string;
      scale !== "1" && url.searchParams.append("scale", scale);
      landscape !== "false" && url.searchParams.append("landscape", landscape);
      format !== "a4" && url.searchParams.append("format", format);
    }
    const shareData = { title: name, url: url.toString() };
    try {
      closeShareDialog();
      await navigator.share(shareData);
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      dispatch(actions.announce({ message: "Link copied to clipboard" }));
    }
  };

  useFixedBodyScroll(editDialogOpen || shareDialogOpen);
  const [shareFormat, setShareFormat] = useState("view");
  const shareFormats = isAuthor ? ['view', 'embed', 'pdf', 'edit'] : ['view', 'embed', 'pdf'];
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      {options.includes("edit") && <>
        <IconButton
          aria-label='Edit Document'
          onClick={openEditDialog}
          size="small"
        >
          <Settings />
        </IconButton>
        <Dialog open={editDialogOpen} onClose={closeEditDialog} fullWidth maxWidth="xs" fullScreen={fullScreen}>
          <form onSubmit={formik.handleSubmit} noValidate autoComplete="off" spellCheck="false">
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
                helperText={formik.errors.handle ?? `https://matheditor.me/view/${formik.values.handle || id}`}
              />
              {isAuthor && <FormControlLabel
                control={<Checkbox checked={isPublished} onChange={togglePublished} />}
                label="Published"
              />}
              <FormHelperText>
                Published documents are showcased on the homepage, can be forked by anyone, and can be found by search engines.
              </FormHelperText>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeEditDialog}>Cancel</Button>
              <Button type='submit'>Save</Button>
            </DialogActions>
          </form>
        </Dialog>
      </>
      }
      {options.includes('share') && <>
        <IconButton
          aria-label="Share Document"
          onClick={openShareDialog}
          size="small"
        >
          <Share />
        </IconButton>
        <Dialog open={shareDialogOpen} onClose={closeShareDialog} fullWidth maxWidth="xs" fullScreen={fullScreen}>
          <form onSubmit={handleShare}>
            <DialogTitle>Share Document</DialogTitle>
            <DialogContent>
              <ShareTabs format={shareFormat} setFormat={setShareFormat} formats={shareFormats} cloudDocument={cloudDocument} />
            </DialogContent>
            <DialogActions>
              <Button onClick={closeShareDialog}>Cancel</Button>
              <Button type='submit'>Share</Button>
            </DialogActions>
          </form>
        </Dialog>
      </>
      }
      <IconButton
        id={`${id}-action-button`}
        aria-controls={open ? `${id}-action-menu` : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label='Document Actions'
        onClick={openMenu}
        size="small"
      >
        <MoreVert />
      </IconButton>
      <Menu
        id={`${id}-action-menu`}
        aria-labelledby={`${id}-action-button`}
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
              <Download />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
        }
        {options.includes('fork') && <MenuItem onClick={handleFork}>
          <ListItemIcon>
            <FileCopy />
          </ListItemIcon>
          <ListItemText>Fork</ListItemText>
        </MenuItem>
        }
        {options.includes('upload') &&
          isLocalDocument && !isUpToDate &&
          <MenuItem onClick={isUploaded ? handleUpdate : handleCreate}>
            <ListItemIcon>
              {isUploaded ? <CloudSync /> : <CloudUpload />}
            </ListItemIcon>
            <ListItemText>
              {isUploaded ? "Update Cloud" : "Save to Cloud"}
            </ListItemText>
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

interface TabPanelProps {
  children?: React.ReactNode;
  active: boolean;
}

function TabPanel({ active, children }: TabPanelProps) {
  return active && <Box sx={{ p: 2 }}>{children}</Box>;
}

export function ShareTabs({ format, setFormat, formats, cloudDocument }: { format: string, setFormat: (value: string) => void, formats: string[], cloudDocument?: CloudDocument }) {
  const dispatch = useDispatch();

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setFormat(newValue);
  };

  const updateCoauthors = (users: (User | string)[]) => {
    if (!cloudDocument) return dispatch(actions.announce({ message: "Please save document to the cloud first" }));
    const coauthors = users.map(u => typeof u === "string" ? u : u.email);
    dispatch(actions.updateCloudDocument({ id: cloudDocument.id, partial: { coauthors } }));
  }

  return (
    <Box>
      <Tabs
        variant="scrollable"
        allowScrollButtonsMobile
        value={format}
        onChange={handleChange}
        aria-label="Share tabs"
      >
        {formats.map(format => <Tab key={format} label={format} value={format} />)}
      </Tabs>
      {formats.includes("view") && <TabPanel active={format === "view"}>
        <FormControl fullWidth>
          <FormLabel>Permissions</FormLabel>
          <FormControlLabel control={<Checkbox checked={true} disabled={true} />} label="Anyone with the link" />
          <FormHelperText>only author and coauthors can fork non-published documents</FormHelperText>
        </FormControl>
      </TabPanel>}
      {formats.includes("embed") && <TabPanel active={format === "embed"}>
        <FormControl fullWidth>
          <FormLabel>Permissions</FormLabel>
          <FormControlLabel control={<Checkbox checked={true} disabled={true} />} label="Anyone with the link" />
        </FormControl>
      </TabPanel>}
      {formats.includes("pdf") && <TabPanel active={format === "pdf"}>
        <FormControl fullWidth>
          <FormLabel>Permissions</FormLabel>
          <FormControlLabel control={<Checkbox checked={true} disabled={true} />} label="Anyone with the link" />
        </FormControl>
        <FormControl fullWidth>
          <FormLabel>Scale</FormLabel>
          <Slider
            name='scale'
            aria-label="scale"
            defaultValue={1}
            valueLabelDisplay="auto"
            step={0.1}
            marks
            min={0.1}
            max={2}
          />
        </FormControl>
        <FormControl fullWidth>
          <FormLabel>Orientation</FormLabel>
          <RadioGroup row aria-label="orientation" name="landscape" defaultValue="false">
            <FormControlLabel value="false" control={<Radio />} label="Portrait" />
            <FormControlLabel value="true" control={<Radio />} label="Landscape" />
          </RadioGroup>
        </FormControl>
        <FormControl fullWidth>
          <FormLabel>Size</FormLabel>
          <RadioGroup row aria-label="size" name="format" defaultValue="a4">
            <FormControlLabel value="letter" control={<Radio />} label="Letter" />
            <FormControlLabel value="a4" control={<Radio />} label="A4" />
          </RadioGroup>
        </FormControl>
      </TabPanel>}
      {formats.includes("edit") && <TabPanel active={format === "edit"}>
        <FormControl fullWidth>
          <FormLabel sx={{ mb: 2 }}>Permissions</FormLabel>
          <UsersAutocomplete label='Coauthors' placeholder='Email' value={cloudDocument?.coauthors ?? []} onChange={updateCoauthors} />
          <FormHelperText>only author and coauthors can edit this document</FormHelperText>
        </FormControl>
      </TabPanel>}
    </Box>
  );
}