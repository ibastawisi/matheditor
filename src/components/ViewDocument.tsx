"use client"
import RouterLink from 'next/link'
import { Transition } from 'react-transition-group';
import { useScrollTrigger, Fab, IconButton, Typography, Avatar, Chip, Box, SwipeableDrawer } from '@mui/material';

import "mathlive/static.css"
import '@/editor/theme.css';
import { Article, Close, Edit, Info } from '@mui/icons-material';
import { CloudDocument } from '@/types';
import { useSelector } from '@/store';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const ViewDocument: React.FC<React.PropsWithChildren & { cloudDocument: CloudDocument }> = ({ cloudDocument, children }) => {
  const slideTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });
  const user = useSelector(state => state.user);
  const handle = cloudDocument.handle || cloudDocument.id;
  const isAuthor = cloudDocument.author.id === user?.id;
  const isCoauthor = cloudDocument.coauthors.some(u => u.id === user?.id);
  const showFork = cloudDocument.published || isAuthor || isCoauthor;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [open, setOpen] = useState(false);
  const onOpen = () => { setOpen(true); };
  const onClose = () => { setOpen(false); };

  return <>
    {children}
    {mounted && createPortal(<IconButton aria-label="Revisions" color='inherit' onClick={onOpen}><Info /></IconButton>, document.querySelector('#app-toolbar')!)}
    <SwipeableDrawer
      anchor="right"
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      sx={{ displayPrint: 'none' }}
    >
      <Box sx={{ p: 2, width: 300 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Article sx={{ mr: 1 }} />
          <Typography variant="h6">Document Info</Typography>
          <IconButton onClick={onClose} sx={{ ml: "auto" }}><Close /></IconButton>
        </Box>
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
        </Box>
      </Box>
    </SwipeableDrawer>

    {showFork && <Transition in={slideTrigger} timeout={225}>
      <Fab variant="extended" size='medium' component={RouterLink} prefetch={false} href={`/new/${handle}`}
        sx={{ position: 'fixed', right: slideTrigger ? 64 : 24, bottom: 16, px: 2, displayPrint: 'none', transition: `right 225ms ease-in-out`, zIndex: 1400 }}>
        <Edit />Fork
      </Fab>
    </Transition>}
  </>
}

export default ViewDocument;