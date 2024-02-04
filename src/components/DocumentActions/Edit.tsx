"use client"
import { useDispatch, actions, useSelector } from "@/store";
import { UserDocument, EditorDocument, CheckHandleResponse, DocumentUpdateInput } from "@/types";
import { CloudOff, Settings } from "@mui/icons-material";
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControlLabel, Checkbox, FormHelperText, useMediaQuery, ListItemIcon, ListItemText, MenuItem, TextField, Box, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { useTheme } from "@mui/material/styles";
import useFixedBodyScroll from "@/hooks/useFixedBodyScroll";
import { useFormik } from "formik";
import * as yup from 'yup';
import { validate } from "uuid";
import { debounce } from '@mui/material/utils';
import UploadDocument from "./Upload";

const EditDocument: React.FC<{ userDocument: UserDocument, variant?: 'menuitem' | 'iconbutton', closeMenu?: () => void }> = ({ userDocument, variant = 'iconbutton', closeMenu }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocal = !!localDocument;
  const isCloud = !!cloudDocument;
  const isUploaded = isLocal && isCloud;
  const isPublished = isCloud && cloudDocument.published;
  const isCollab = isPublished && cloudDocument.collab;
  const isAuthor = isCloud ? cloudDocument.author.id === user?.id : true
  const id = userDocument.id;
  const name = cloudDocument?.name ?? localDocument?.name ?? "Untitled Document";
  const handle = cloudDocument?.handle ?? localDocument?.handle ?? null;

  const togglePublished = async () => {
    if (!isCloud) return dispatch(actions.announce({ message: "Please save document to the cloud first" }));
    const payload: { id: string, partial: DocumentUpdateInput } = { id, partial: { published: !isPublished } };
    if (!payload.partial.published) payload.partial.collab = false;
    const response = await dispatch(actions.updateCloudDocument(payload));
    if (response.type === actions.updateCloudDocument.fulfilled.type) {
      dispatch(actions.announce({ message: `Document ${isPublished ? "unpublished" : "published"} successfully` }));
      dispatch(actions.updateLocalDocument({ id, partial: payload.partial }))
    }
  };

  const toggleCollab = async () => {
    if (!isCloud) return dispatch(actions.announce({ message: "Please save document to the cloud first" }));
    const payload = { id, partial: { collab: !isCollab } };
    const response = await dispatch(actions.updateCloudDocument(payload));
    if (response.type === actions.updateCloudDocument.fulfilled.type) {
      dispatch(actions.announce({ message: `Document collaboration mode is ${isCollab ? "off" : "on"}` }));
      dispatch(actions.updateLocalDocument({ id, partial: { collab: !isCollab } }))
    }
  };

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const openEditDialog = () => {
    if (closeMenu) closeMenu();
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
      handle: handle || "",
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
      if (isLocal) {
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

  useFixedBodyScroll(editDialogOpen);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  return <>
    {variant === 'menuitem' ? <MenuItem onClick={openEditDialog}>
      <ListItemIcon><Settings /></ListItemIcon>
      <ListItemText>Edit</ListItemText>
    </MenuItem> : <IconButton aria-label="Edit Document" onClick={openEditDialog} size="small"><Settings /></IconButton>}
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
          {!cloudDocument && <Box sx={{ display: 'flex', flexDirection: "column", alignItems: "center", my: 2, gap: 2 }}>
            <CloudOff sx={{ width: 64, height: 64, fontSize: 64 }} />
            <Typography variant="overline" align="center" component="p">Please save document to the cloud first to unlock the following options</Typography>
            <UploadDocument userDocument={userDocument} variant="button" />
          </Box>}
          <TextField margin="normal" size="small" fullWidth
            id="handle"
            label="Document Handle"
            name="handle"
            disabled={!isCloud}
            value={formik.values.handle}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={!!formik.errors.handle}
            helperText={formik.errors.handle ?? `https://matheditor.me/view/${formik.values.handle || id}`}
          />
          {isAuthor && <FormControlLabel
            control={<Checkbox checked={isPublished} disabled={!isCloud} onChange={togglePublished} />}
            label="Published"
          />}
          <FormHelperText>
            Published documents are showcased on the homepage, can be forked by anyone, and can be found by search engines.
          </FormHelperText>
          {isAuthor && <FormControlLabel
            control={<Checkbox checked={isCollab} disabled={!isCloud || !isPublished} onChange={toggleCollab} />}
            label="Collab"
          />}
          <FormHelperText>
            Published Collab documents are open for anyone to edit. Unpublished Collab documents are only editable by authors.
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

export default EditDocument;