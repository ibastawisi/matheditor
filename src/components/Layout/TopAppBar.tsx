"use client"
import { usePathname } from 'next/navigation';
import RouterLink from 'next/link'
import { useEffect } from 'react';
import logo from "@public/logo.svg";
import Image from 'next/image';
import { useAppStore } from '@/store';
import { useScrollTrigger, Zoom, Box, AppBar, Toolbar, Typography, IconButton, Avatar, AvatarGroup, Fab, Link, Tooltip } from '@mui/material';
import { Print, KeyboardArrowUp, Info, CloudOff, CloudSync } from '@mui/icons-material';

function ScrollTop() {
  const trigger = useScrollTrigger({ disableHysteresis: true });

  const handleClick = () => {
    const anchor = document.querySelector('#back-to-top-anchor');
    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  return (
    <Zoom in={trigger}>
      <Fab color="secondary" size="small" aria-label="scroll back to top" onClick={handleClick}
        sx={{
          position: 'fixed', bottom: 16, right: 16, displayPrint: "none", transition: 'bottom 0.3s',
          '@media (max-width: 496px)': {
            '&:has(~.editor-container .editor-toolbar #text-format-toggles)': { bottom: 48 }
          }
        }}>
        <KeyboardArrowUp />
      </Fab>
    </Zoom >
  );
}

/** Who else is editing the document live, and whether this editor is connected */
function LivePresence() {
  const live = useAppStore(state => state.live);
  if (!live) return null;
  if (live.status !== "connected") {
    const title = live.status === "connecting" ? "Joining the live session" : "Offline, your changes will sync when you reconnect";
    return (
      <Tooltip title={title}>
        <Box role="status" aria-label={title} sx={{ display: "flex", mx: 1 }}>
          {live.status === "connecting" ? <CloudSync /> : <CloudOff />}
        </Box>
      </Tooltip>
    );
  }
  if (live.collaborators.length === 0) return null;
  return (
    <AvatarGroup max={4} aria-label="Editing now" sx={{ mx: 1, '& .MuiAvatar-root': { width: 30, height: 30, fontSize: 14 } }}>
      {live.collaborators.map(collaborator => (
        <Tooltip key={collaborator.id} title={`${collaborator.name} is editing`}>
          <Avatar alt={collaborator.name} src={collaborator.image ?? undefined}
            sx={{ borderColor: `${collaborator.color} !important`, bgcolor: collaborator.color }}>
            {collaborator.name.charAt(0).toUpperCase()}
          </Avatar>
        </Tooltip>
      ))}
    </AvatarGroup>
  );
}

const TopAppBar: React.FC = () => {
  const toggleDrawer = useAppStore(state => state.toggleDrawer);
  const load = useAppStore(state => state.load);
  const pathname = usePathname();
  const showPrintButton = !!['/edit', '/view', '/playground'].find(path => pathname.startsWith(path));
  const showDrawerButton = !!['/edit', '/view'].find(path => pathname.startsWith(path));
  const initialized = useAppStore(state => state.initialized);
  const user = useAppStore(state => state.user);

  const handlePrint = () => { window.print(); }
  const handleToggleDrawer = () => { toggleDrawer(); }

  const handleResize = () => {
    const keyboardInsetHeight = window.innerHeight - (window.visualViewport?.height || window.innerHeight);
    document.documentElement.style.setProperty('--keyboard-inset-height', `${keyboardInsetHeight}px`);
  };

  useEffect(() => {
    if (!initialized) load();
    if (!window.visualViewport) return;
    window.visualViewport.addEventListener("resize", handleResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
    }
  }, []);

  return (
    <>
      {/* keeps the app bar's height in the flow while it is fixed */}
      <Box id="back-to-top-anchor" sx={(theme) => ({ ...theme.mixins.toolbar, displayPrint: "none" })}>
        <AppBar sx={{ displayPrint: "none", }}>
          <Toolbar id="app-toolbar">
            <Link component={RouterLink} prefetch={false} href="/" sx={{ textDecoration: "none" }}>
              <Box sx={{ display: "flex" }}>
                <Image src={logo} alt="Logo" width={32} height={32} priority />
                <Typography variant="h6" component="h1" sx={{ marginInlineStart: 2, color: "white" }}>Math Editor</Typography>
              </Box>
            </Link>
            <Box sx={{ flexGrow: 1 }} />
            <LivePresence />
            <IconButton component={RouterLink} prefetch={false} href="/dashboard" aria-label="Dashboard">
              <Avatar alt={user?.name} src={user?.image ?? undefined} sx={{ width: 30, height: 30 }} />
            </IconButton>
            {showPrintButton && <IconButton aria-label="Print" color="inherit" onClick={handlePrint}>
              <Print />
            </IconButton>}
            {showDrawerButton && <IconButton id="document-info" aria-label="Document Info" color='inherit' onClick={handleToggleDrawer}
              sx={{ '& >.MuiBadge-root': { height: '1em', userSelect: 'none', zIndex: -1 } }} ><Info /></IconButton>}
          </Toolbar>
        </AppBar>
      </Box>
      <ScrollTop />
    </>
  );
};

export default TopAppBar;