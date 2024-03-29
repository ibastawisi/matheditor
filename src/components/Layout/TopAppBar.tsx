"use client"
import { usePathname } from 'next/navigation';
import RouterLink from 'next/link'
import { useContext, useEffect } from 'react';
import { ColorModeContext } from '@/components/Layout/ThemeProvider';
import logo from "@public/logo.svg";
import Image from 'next/image';
import { useDispatch, actions, useSelector } from '@/store';
import { useTheme } from '@mui/material/styles';
import { useScrollTrigger, Slide, Zoom, Box, AppBar, Toolbar, Typography, IconButton, Avatar, Fab, Link, Badge } from '@mui/material';
import { Brightness7, Brightness4, Print, KeyboardArrowUp, Info } from '@mui/icons-material';
import { UserDocumentRevision, LocalDocumentRevision } from '@/types';

function HideOnScroll({ children }: { children: React.ReactElement }) {
  const pathname = usePathname();
  const shouldHide = !!['/edit', '/playground', '/tutorial'].find(path => pathname.startsWith(path));
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 32,
  });
  if (!shouldHide) return children;
  return (
    <Slide appear={false} direction="down" in={!trigger}>{children}</Slide>
  );
}

function ScrollTop() {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
  });

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
        sx={{ position: 'fixed', bottom: 16, right: 16, displayPrint: "none" }}>
        <KeyboardArrowUp />
      </Fab>
    </Zoom >
  );
}

const TopAppBar: React.FC<{}> = () => {
  const colorMode = useContext(ColorModeContext);
  const dispatch = useDispatch();
  const theme = useTheme();
  const pathname = usePathname();
  const showPrintButton = !!['/edit', '/view', '/playground', '/tutorial'].find(path => pathname.startsWith(path));
  const showDrawerButton = !!['/edit', '/view'].find(path => pathname.startsWith(path));
  const initialized = useSelector(state => state.ui.initialized);
  const user = useSelector(state => state.user);

  const handlePrint = () => { window.print(); }

  useEffect(() => {
    if (!initialized) dispatch(actions.load());
  }, []);

  return (
    <>
      <HideOnScroll>
        <AppBar sx={{ displayPrint: "none" }}>
          <Toolbar sx={{ minHeight: 64 }} id="app-toolbar">
            <Link component={RouterLink} prefetch={false} href="/">
              <Box sx={{ display: "flex" }}>
                <Image src={logo} alt="Logo" width={32} height={32} priority />
                <Typography variant="h6" component="h1" sx={{ marginInlineStart: 2, color: "white" }}>Math Editor</Typography>
              </Box>
            </Link>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton component={RouterLink} prefetch={false} href="/dashboard" aria-label="Dashboard">
              <Avatar alt={user?.name} src={user?.image ?? undefined} sx={{ width: 30, height: 30 }} />
            </IconButton>
            <IconButton onClick={colorMode.toggleColorMode} color="inherit" aria-label='Toggle dark mode'>
              {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            {showPrintButton && <IconButton aria-label="Print" color="inherit" onClick={handlePrint}>
              <Print />
            </IconButton>}
            {showDrawerButton && <DrawerButton />}
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Toolbar id="back-to-top-anchor" sx={{ displayPrint: "none" }} />
      <ScrollTop />
    </>
  );
};

export default TopAppBar;

const DrawerButton = () => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const isEdit = pathname.startsWith('/edit');
  const showDrawerButton = !!['/edit', '/view'].find(path => pathname.startsWith(path));
  const documentId = showDrawerButton && pathname.split('/')[2]?.toLowerCase();
  const userDocument = useSelector(state => state.documents.find(d => d.id === documentId || (d.cloud || d.local)?.handle === documentId));
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const localDocumentRevisions = localDocument?.revisions ?? [];
  const cloudDocumentRevisions = cloudDocument?.revisions ?? [];

  const revisions: UserDocumentRevision[] = [...cloudDocumentRevisions];
  if (isEdit) localDocumentRevisions.forEach(revision => { if (!revisions.find(r => r.id === revision.id)) revisions.push(revision); });
  if (isEdit && localDocument && !revisions.find(r => r.id === localDocument.head)) {
    const unsavedRevision = {
      id: localDocument.head,
      documentId: localDocument.id,
      createdAt: localDocument.updatedAt,
    } as LocalDocumentRevision;
    revisions.unshift(unsavedRevision);
  }
  
  const revisionsBadgeContent = isEdit ? revisions.length : cloudDocumentRevisions.length;
  const showRevisionsBadge = revisionsBadgeContent > (isEdit ? 0 : 1);

  const toggleDrawer = () => { dispatch(actions.toggleDrawer()); }

  return <IconButton id="document-info" aria-label="Document Info" color='inherit' onClick={toggleDrawer}>
    {showRevisionsBadge ? <Badge badgeContent={revisionsBadgeContent} color="secondary"><Info /></Badge> : <Info />}
  </IconButton>
}