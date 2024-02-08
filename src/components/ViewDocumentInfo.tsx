"use client"
import { CloudDocument, User } from '@/types';
import { Avatar, Box, Chip, Fab, Grid, IconButton, Typography, useScrollTrigger } from '@mui/material';
import { Edit, FileCopy, Print, History } from '@mui/icons-material';
import RouterLink from "next/link";
import ShareDocument from './DocumentActions/Share';
import DownloadDocument from './DocumentActions/Download';
import ForkDocument from './DocumentActions/Fork';
import { Transition } from 'react-transition-group';
import AppDrawer from './AppDrawer';
import ViewRevisionCard from './ViewRevisionCard';

export default function EditDocumentInfo({ cloudDocument, user }: { cloudDocument: CloudDocument, user?: User }) {
  const slideTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handle = cloudDocument.handle || cloudDocument.id;
  const isAuthor = cloudDocument.author.id === user?.id;
  const isCoauthor = cloudDocument.coauthors.some(u => u.id === user?.id);
  const showFork = cloudDocument.published || isAuthor || isCoauthor;
  const userDocument = { id: cloudDocument.id, cloud: cloudDocument };
  const isPublished = cloudDocument.published;
  const isCollab = isPublished && cloudDocument.collab;
  const collaborators = isCollab ? cloudDocument.revisions.reduce((acc, rev) => {
    if (rev.author.id !== cloudDocument.author.id &&
      !cloudDocument.coauthors.some(u => u.id === rev.author.id) &&
      !acc.find(u => u.id === rev.author.id)) acc.push(rev.author);
    return acc;
  }, [] as User[]) : [];

  const isEditable = isAuthor || isCoauthor || isCollab;

  return (
    <>
      <AppDrawer title="Document Info">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: "start", justifyContent: "start", gap: 1, my: 3 }}>
          <Typography component="h2" variant="h6">{cloudDocument.name}</Typography>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Last Updated: {new Date(cloudDocument.updatedAt).toLocaleDateString()}</Typography>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, alignSelf: "flex-end" }}>
            <IconButton aria-label="Print" color="inherit" onClick={() => { window.print(); }}><Print /></IconButton>
            <ShareDocument userDocument={userDocument} />
            {showFork && <ForkDocument userDocument={userDocument} />}
            {(isAuthor || isCoauthor) && <DownloadDocument userDocument={userDocument} />}
            {(isEditable) && <IconButton component={RouterLink} prefetch={false} href={`/edit/${handle}`} aria-label="Edit"><Edit /></IconButton>}
          </Box>
        </Box>
        {isEditable && <Grid container spacing={1}>
          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
            <History sx={{ mr: 1 }} />
            <Typography variant="h6">Revisions</Typography>
          </Grid>
          {cloudDocument.revisions.map(revision => <Grid item xs={12} key={revision.id}><ViewRevisionCard cloudDocument={cloudDocument} revision={revision} /></Grid>)}
        </Grid>}
      </AppDrawer>
      {showFork && <Transition in={slideTrigger} timeout={225}>
        <Fab variant="extended" size='medium' component={RouterLink} prefetch={false} href={isEditable ? `/edit/${handle}` : `/new/${handle}`}
          sx={{ position: 'fixed', right: slideTrigger ? 64 : 24, bottom: 16, px: 2, displayPrint: 'none', transition: `right 225ms ease-in-out` }}>
          {isEditable ? <Edit sx={{ mr: 1 }} /> : <FileCopy sx={{ mr: 1 }} />}{isEditable ? 'Edit' : 'Fork'}
        </Fab>
      </Transition>}
    </>
  );
}