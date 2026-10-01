import { LocalDocumentRevision, User, UserDocumentRevision } from '@/types';
import RevisionCard from './EditRevisionCard';
import { useAppStore } from '@/store';
import Grid from '@mui/material/Grid';
import { Avatar, Badge, Box, Button, Chip, Divider, MenuItem, Portal, TextField, Typography } from '@mui/material';
import { Compare, Description, History, Info, Print, Search, Settings, Share, Toc } from '@mui/icons-material';
import type { LexicalEditor } from 'lexical';
import { RefObject } from 'react';
import RouterLink from "next/link";
import { ShareDocumentForm } from '../DocumentActions/Share';
import DownloadDocument from '../DocumentActions/Download';
import ForkDocument from '../DocumentActions/Fork';
import { EditDocumentForm } from '../DocumentActions/Edit';
import AppDrawer, { type AppDrawerTab } from '../AppDrawer';
import PageSetupSidebar from '@/editor/extensions/pages/sidebar';
import { EditorTableOfContentsPanel } from '@/editor/extensions/table-of-contents/panel';
import { EditorSearchPanel } from '@/editor/extensions/search/panel';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import useSearchShortcut from '@/hooks/useSearchShortcut';

export default function EditDocumentInfo({ editorRef, editor, documentId }: { editorRef: RefObject<LexicalEditor | null>, editor: LexicalEditor | null, documentId: string }) {
  const setDiff = useAppStore(state => state.setDiff);
  const createLocalRevision = useAppStore(state => state.createLocalRevision);
  const toggleDrawer = useAppStore(state => state.toggleDrawer);
  const user = useAppStore(state => state.user);
  const userDocument = useAppStore(state => state.documents.find(d => d.id === documentId));
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isCloud = !!cloudDocument;
  const localDocumentRevisions = localDocument?.revisions ?? [];
  const cloudDocumentRevisions = cloudDocument?.revisions ?? [];
  const isHeadLocalRevision = localDocumentRevisions.some(r => r.id === localDocument?.head);
  const isHeadCloudRevision = cloudDocumentRevisions.some(r => r.id === localDocument?.head);
  const isAuthor = isCloud ? cloudDocument.author.id === user?.id : true
  const isCollab = isCloud && cloudDocument.collab;
  const collaborators = isCollab ? cloudDocument.revisions.reduce((acc, rev) => {
    if (rev.author.id !== cloudDocument.author.id &&
      !cloudDocument.coauthors.some(u => u.id === rev.author.id) &&
      !acc.find(u => u.id === rev.author.id)) acc.push(rev.author);
    return acc;
  }, [] as User[]) : [];

  const revisions: UserDocumentRevision[] = [...cloudDocumentRevisions];
  localDocumentRevisions.forEach(revision => { if (!cloudDocumentRevisions.some(r => r.id === revision.id)) revisions.push(revision); });
  const documentRevisions = [...revisions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unsavedChanges = !isHeadLocalRevision && !isHeadCloudRevision;
  if (unsavedChanges && localDocument) {
    const unsavedRevision = { id: localDocument.head, documentId: localDocument.id, createdAt: localDocument.updatedAt } as LocalDocumentRevision;
    documentRevisions.unshift(unsavedRevision);
  }

  const revisionsBadgeContent = revisions.length;
  const showRevisionsBadge = revisionsBadgeContent > 0;

  const diff = useAppStore(state => state.diff);
  const isDiffViewOpen = diff.open;
  const isOnline = useOnlineStatus();
  const openDiffView = async () => {
    if (unsavedChanges) await saveEditorRevision();
    const newRevisionId = documentRevisions[0]?.id;
    const oldRevisionId = documentRevisions[1]?.id ?? newRevisionId;
    setDiff({ open: true, old: oldRevisionId, new: newRevisionId });
  }

  // the diff view is shown while the diff tab is selected
  const handleTabChange = (value: string) => {
    if (value === "diff") openDiffView();
    else if (isDiffViewOpen) setDiff({ open: false });
  }

  useSearchShortcut(!!editor, () => handleTabChange("search"));

  const getLocalEditorData = () => editorRef.current?.getEditorState().toJSON();

  const saveEditorRevision = async () => {
    if (!localDocument) return;
    const data = getLocalEditorData();
    if (!data) return;
    const payload = {
      id: localDocument.head,
      documentId: localDocument.id,
      createdAt: localDocument.updatedAt,
      data,
    }
    const { data: localRevision } = await createLocalRevision(payload);
    return localRevision;
  }

  const details = (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: "start", justifyContent: "start", gap: 1 }}>
      {localDocument && <>
        <Typography component="h2" variant="h6">{localDocument.name}</Typography>
        <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>Created: {new Date(localDocument.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</Typography>
        <Typography variant="subtitle2" gutterBottom sx={{ color: "text.secondary" }}>Updated: {new Date(localDocument.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</Typography>
        {!cloudDocument && <Typography variant="subtitle2">Author <Chip
          avatar={<Avatar />}
          label={user?.name ?? "Local User"}
          variant="outlined"
        />
        </Typography>}
      </>}
      {cloudDocument && <>
        <Typography variant="subtitle2">Author <Chip clickable component={RouterLink} prefetch={false}
          href={`/user/${cloudDocument.author.handle || cloudDocument.author.id}`}
          avatar={<Avatar alt={cloudDocument.author.name} src={cloudDocument.author.image || undefined} />}
          label={cloudDocument.author.name}
          variant="outlined"
        />
        </Typography>
        {cloudDocument.coauthors.length > 0 && <>
          <Typography component="h3" variant="subtitle2">Coauthors</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {cloudDocument.coauthors.map(coauthor => (
              <Chip clickable component={RouterLink} prefetch={false}
                href={`/user/${coauthor.handle || coauthor.id}`}
                key={coauthor.id}
                avatar={<Avatar alt={coauthor.name} src={coauthor.image || undefined} />}
                label={coauthor.name}
                variant="outlined"
              />
            ))}
          </Box>
        </>}
        {collaborators.length > 0 && <>
          <Typography component="h3" variant="subtitle2">Collaborators</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {collaborators.map(user => (
              <Chip clickable component={RouterLink} prefetch={false}
                href={`/user/${user.handle || user.id}`}
                key={user.id}
                avatar={<Avatar alt={user.name} src={user.image || undefined} />}
                label={user.name}
                variant="outlined"
              />
            ))}
          </Box>
        </>}
      </>}
      {userDocument && <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, alignSelf: 'stretch', '& > *': { flex: '1 1 auto' } }}>
        <Button variant="outlined" onClick={() => { window.print(); }} startIcon={<Print />}>Print</Button>
        <ForkDocument userDocument={userDocument} variant="button" />
        <DownloadDocument userDocument={userDocument} variant="button" />
      </Box>}
      {userDocument && isAuthor && <>
        <Divider flexItem sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Settings sx={{ mr: 1 }} />
          <Typography component="h3" variant="h6">Settings</Typography>
        </Box>
        <Box sx={{ alignSelf: 'stretch' }}>
          <EditDocumentForm userDocument={userDocument} />
        </Box>
      </>}
    </Box>
  );

  const revisionsTab = (
    <Grid container spacing={1}>
      {documentRevisions.map(revision => <Grid size={{ xs: 12 }} key={revision.id}><RevisionCard revision={revision} editorRef={editorRef} /></Grid>)}
    </Grid>
  );

  const formatRevisionDate = (revision: UserDocumentRevision) => new Date(revision.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  // a cloud revision has to be fetched before it can be compared
  const isRevisionAvailable = (revision: UserDocumentRevision) => isOnline || localDocumentRevisions.some(r => r.id === revision.id);

  const diffTab = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {(["old", "new"] as const).map(side => (
        <TextField
          key={side}
          select
          size="small"
          label={side === "old" ? "Old revision" : "New revision"}
          value={isDiffViewOpen && documentRevisions.some(r => r.id === diff[side]) ? diff[side] : ''}
          onChange={e => setDiff({ [side]: e.target.value })}
        >
          {documentRevisions.map(revision => (
            <MenuItem key={revision.id} value={revision.id} disabled={!isRevisionAvailable(revision)}>{formatRevisionDate(revision)}</MenuItem>
          ))}
        </TextField>
      ))}
    </Box>
  );

  const tabs: AppDrawerTab[] = [{ value: "details", label: "Details", icon: <Info />, content: details }];
  if (editor) tabs.push({
    value: "contents", label: "Contents", icon: <Toc />,
    content: <EditorTableOfContentsPanel editor={editor} onNavigate={() => toggleDrawer(false)} />
  }, {
    value: "search", label: "Search", icon: <Search />,
    content: <EditorSearchPanel editor={editor} onNavigate={() => toggleDrawer(false)} />
  }, {
    value: "page", label: "Page", icon: <Description />,
    content: <PageSetupSidebar editor={editor} onClose={() => toggleDrawer(false)} />
  });
  if (userDocument) tabs.push({ value: "share", label: "Share", icon: <Share />, content: <ShareDocumentForm userDocument={userDocument} /> });
  tabs.push({ value: "diff", label: "Diff", icon: <Compare />, content: diffTab });
  tabs.push({
    value: "revisions", label: "Revisions", icon: <History />,
    badge: showRevisionsBadge ? revisionsBadgeContent : undefined, content: revisionsTab
  });

  return (
    <>
      <AppDrawer title="Document Info" tabs={tabs} onChange={handleTabChange} />
      {showRevisionsBadge && <Portal container={document.querySelector('#document-info')}>
        <Badge badgeContent={revisionsBadgeContent} color="secondary"></Badge>
      </Portal>}
    </>
  );
}