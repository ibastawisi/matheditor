"use client"
import { useDispatch, actions, useSelector } from "@/store";
import { User, UserDocument } from "@/types";
import { CloudOff, Share } from "@mui/icons-material";
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Tabs, Tab, FormControl, FormLabel, FormControlLabel, Checkbox, FormHelperText, Slider, RadioGroup, Radio, useMediaQuery, ListItemIcon, ListItemText, MenuItem, Select, Typography } from "@mui/material";
import UsersAutocomplete from "../UsersAutocomplete";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import useFixedBodyScroll from "@/hooks/useFixedBodyScroll";
import UploadDocument from "./Upload";
import { useSearchParams } from "next/navigation";

const ShareDocument: React.FC<{ userDocument: UserDocument, variant?: 'menuitem' | 'iconbutton', closeMenu?: () => void }> = ({ userDocument, variant = 'iconbutton', closeMenu }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isCloud = !!cloudDocument;
  const isAuthor = isCloud ? cloudDocument.author.id === user?.id : true
  const id = userDocument.id;
  const name = cloudDocument?.name ?? localDocument?.name ?? "Untitled Document";
  const handle = cloudDocument?.handle ?? localDocument?.handle ?? null;

  const formats = isAuthor ? ['view', 'embed', 'pdf', 'edit'] : ['view', 'embed', 'pdf'];
  const [format, setFormat] = useState("view");
  const [revision, setRevision] = useState(cloudDocument?.head ?? null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const searchParams = useSearchParams();

  const openShareDialog = () => {
    if (closeMenu) closeMenu();
    setFormat("view");
    const v = searchParams.get("v");
    setRevision(v || (cloudDocument?.head ?? null));
    setShareDialogOpen(true);
  };

  const closeShareDialog = () => {
    setShareDialogOpen(false);
  };

  const handleShare = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formdata = new FormData(event.currentTarget);
    if (!isCloud) return dispatch(actions.announce({ message: "Please save document to the cloud first" }));
    const url = new URL(window.location.origin);
    url.pathname = `/${format}/${handle || id}`;
    if (revision && revision !== cloudDocument.head) url.searchParams.append("v", revision);
    if (format === "pdf") {
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

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setFormat(newValue);
  };

  const updateCoauthors = (users: (User | string)[]) => {
    if (!cloudDocument) return dispatch(actions.announce({ message: "Please save document to the cloud first" }));
    const coauthors = users.map(u => typeof u === "string" ? u : u.email);
    dispatch(actions.updateCloudDocument({ id: cloudDocument.id, partial: { coauthors } }));
  }

  useFixedBodyScroll(shareDialogOpen);

  return <>
    {variant === 'menuitem' ? <MenuItem onClick={openShareDialog}>
      <ListItemIcon><Share /></ListItemIcon>
      <ListItemText>Share</ListItemText>
    </MenuItem> : <IconButton aria-label="Share Document" onClick={openShareDialog} size="small"><Share /></IconButton>}
    <Dialog open={shareDialogOpen} onClose={closeShareDialog} fullWidth maxWidth="xs" fullScreen={fullScreen}>
      <Box component="form" onSubmit={handleShare}>
        <DialogTitle>Share Document</DialogTitle>
        <DialogContent>
          <Tabs
            variant="scrollable"
            allowScrollButtonsMobile
            value={format}
            onChange={handleChange}
            aria-label="Share tabs"
          >
            {formats.map(format => <Tab key={format} label={format} value={format} />)}
          </Tabs>
          {!cloudDocument && <Box sx={{ display: 'flex', flexDirection: "column", alignItems: "center", my: 5, gap: 2 }}>
            <CloudOff sx={{ width: 64, height: 64, fontSize: 64 }} />
            <Typography variant="overline" component="p">Please save document to the cloud first</Typography>
            <UploadDocument userDocument={userDocument} variant="button" />
          </Box>}
          {cloudDocument && <>
            {formats.includes("view") && format === "view" && <Box sx={{ p: 2 }}>
              <FormControl fullWidth sx={{ gap: 1, mb: 2 }}>
                <FormLabel>Revision</FormLabel>
                <Select size="small" value={revision} onChange={e => setRevision(e.target.value)}>
                  {cloudDocument.revisions.map(revision => <MenuItem key={revision.id} value={revision.id}>{new Date(revision.createdAt).toLocaleString()}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <FormLabel>Permissions</FormLabel>
                <FormControlLabel control={<Checkbox checked={true} disabled={true} />} label="Anyone with the link" />
                <FormHelperText>only author and coauthors can fork non-published documents</FormHelperText>
              </FormControl>
            </Box>}
            {formats.includes("embed") && format === "embed" && <Box sx={{ p: 2 }}>
              <FormControl fullWidth sx={{ gap: 1, mb: 2 }}>
                <FormLabel>Revision</FormLabel>
                <Select size="small" value={revision} onChange={e => setRevision(e.target.value)}>
                  {cloudDocument.revisions.map(revision => <MenuItem key={revision.id} value={revision.id}>{new Date(revision.createdAt).toLocaleString()}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <FormLabel>Permissions</FormLabel>
                <FormControlLabel control={<Checkbox checked={true} disabled={true} />} label="Anyone with the link" />
              </FormControl>
            </Box>}
            {formats.includes("pdf") && format === "pdf" && <Box sx={{ p: 2 }}>
              <FormControl fullWidth sx={{ gap: 1, mb: 2 }}>
                <FormLabel>Revision</FormLabel>
                <Select size="small" value={revision} onChange={e => setRevision(e.target.value)}>
                  {cloudDocument.revisions.map(revision => <MenuItem key={revision.id} value={revision.id}>{new Date(revision.createdAt).toLocaleString()}</MenuItem>)}
                </Select>
              </FormControl>
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
            </Box>}
            {formats.includes("edit") && format === "edit" && <Box sx={{ p: 2 }}>
              <FormControl fullWidth sx={{ gap: 1, mb: 2 }}>
                <FormLabel>Permissions</FormLabel>
                <UsersAutocomplete label='Coauthors' placeholder='Email' value={cloudDocument?.coauthors ?? []} onChange={updateCoauthors} />
                <FormHelperText>only author and coauthors can edit this document</FormHelperText>
              </FormControl>
            </Box>}
          </>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeShareDialog}>Cancel</Button>
          <Button type='submit'>Share</Button>
        </DialogActions>
      </Box>
    </Dialog>
  </>
}

export default ShareDocument;