"use client"
import { CloudDocument, User } from '@/types';
import Grid from '@mui/material/Grid';
import { Avatar, Badge, Box, Button, Chip, Fab, Portal, Typography, useScrollTrigger } from '@mui/material';
import { Edit, FileCopy, Print, History, Info, Search, Share, Toc } from '@mui/icons-material';
import RouterLink from "next/link";
import { ShareDocumentForm } from './DocumentActions/Share';
import DownloadDocument from './DocumentActions/Download';
import ForkDocument from './DocumentActions/Fork';
import AppDrawer, { type AppDrawerTab } from './AppDrawer';
import ViewRevisionCard from './ViewRevisionCard';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store';
import { StaticTableOfContentsPanel } from '@/editor/extensions/table-of-contents/static';
import { useStaticSearch } from '@/editor/extensions/search/static';
import SearchPanel from '@/editor/extensions/search/panel';
import useSearchShortcut from '@/hooks/useSearchShortcut';

export default function ViewDocumentInfo({ cloudDocument, user, container }: { cloudDocument: CloudDocument, user?: User, container: HTMLElement | null }) {
  const toggleDrawer = useAppStore(state => state.toggleDrawer);
  const search = useStaticSearch(container);
  useSearchShortcut(!!search);
  const slideTrigger = useScrollTrigger({ disableHysteresis: true });
  const handle = cloudDocument.handle || cloudDocument.id;
  const isAuthor = cloudDocument.author.id === user?.id;
  const isCoauthor = cloudDocument.coauthors.some(u => u.id === user?.id);
  const userDocument = { id: cloudDocument.id, cloud: cloudDocument };
  const isPublished = cloudDocument.published;
  const isCollab = cloudDocument.collab;
  const isEditable = isAuthor || isCoauthor || isCollab;
  const showFork = isPublished || isEditable;
  const collaborators = isCollab ? cloudDocument.revisions.reduce((acc, rev) => {
    if (rev.author.id !== cloudDocument.author.id &&
      !cloudDocument.coauthors.some(u => u.id === rev.author.id) &&
      !acc.find(u => u.id === rev.author.id)) acc.push(rev.author);
    return acc;
  }, [] as User[]) : [];

  const searchParams = useSearchParams();
  const revisionId = searchParams.get('v');
  const href = isEditable ? `/edit/${handle}` : `/new/${handle}${revisionId ? `?v=${revisionId}` : ''}`;

  const cloudDocumentRevisions = cloudDocument?.revisions ?? [];
  const revisionsBadgeContent = cloudDocumentRevisions.length;
  const showRevisionsBadge = revisionsBadgeContent > 1;

  const details = (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: "start", justifyContent: "start", gap: 1 }}>
      <Typography component="h2" variant="h6">{cloudDocument.name}</Typography>
      <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>Created: {new Date(cloudDocument.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</Typography>
      <Typography variant="subtitle2" gutterBottom sx={{ color: "text.secondary" }}>Updated: {new Date(cloudDocument.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</Typography>
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, alignSelf: 'stretch', '& > *': { flex: '1 1 auto' } }}>
        <Button variant="outlined" onClick={() => { window.print(); }} startIcon={<Print />}>Print</Button>
        {showFork && <ForkDocument userDocument={userDocument} variant="button" />}
        {isEditable && <DownloadDocument userDocument={userDocument} variant="button" />}
        {isEditable && <Button variant="outlined" component={RouterLink} prefetch={false} href={`/edit/${handle}`} startIcon={<Edit />}>Edit</Button>}
      </Box>
    </Box>
  );

  const revisionsTab = (
    <Grid container spacing={1}>
      {cloudDocument.revisions.map(revision => <Grid size={{ xs: 12 }} key={revision.id}><ViewRevisionCard cloudDocument={cloudDocument} revision={revision} /></Grid>)}
    </Grid>
  );

  const tabs: AppDrawerTab[] = [{ value: "details", label: "Details", icon: <Info />, content: details }];
  if (container) tabs.push({
    value: "contents", label: "Contents", icon: <Toc />,
    content: <StaticTableOfContentsPanel container={container} onNavigate={() => toggleDrawer(false)} />
  });
  if (search) tabs.push({
    value: "search", label: "Search", icon: <Search />,
    content: <SearchPanel search={search} onNavigate={() => toggleDrawer(false)} />
  });
  tabs.push(
    { value: "share", label: "Share", icon: <Share />, content: <ShareDocumentForm userDocument={userDocument} /> },
    { value: "revisions", label: "Revisions", icon: <History />, badge: showRevisionsBadge ? revisionsBadgeContent : undefined, content: revisionsTab },
  );

  return (
    <>
      <AppDrawer title="Document Info" tabs={tabs} />
      {showFork && <Fab variant="extended" size='medium' component={RouterLink} prefetch={false} href={href}
        sx={{ position: 'fixed', right: slideTrigger ? 64 : 24, bottom: 16, px: 2, displayPrint: 'none', transition: `right 225ms ease-in-out` }}>
        {isEditable ? <Edit sx={{ mr: 1 }} /> : <FileCopy sx={{ mr: 1 }} />}{isEditable ? 'Edit' : 'Fork'}
      </Fab>}
      {showRevisionsBadge && <Portal container={document.querySelector('#document-info')}>
        <Badge badgeContent={revisionsBadgeContent} color="secondary"></Badge>
      </Portal>}
    </>
  );
}