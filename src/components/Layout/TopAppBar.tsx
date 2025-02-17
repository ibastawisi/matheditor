"use client"
import { usePathname } from 'next/navigation';
import RouterLink from 'next/link'
import { useEffect } from 'react';
import logo from "@public/logo.svg";
import Image from 'next/image';
import { useDispatch, actions, useSelector } from '@/store';
import { useScrollTrigger, Zoom, Box, AppBar, Toolbar, Typography, IconButton, Avatar, Fab, Link } from '@mui/material';
import { Print, KeyboardArrowUp, Info } from '@mui/icons-material';

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
        sx={{ position: 'fixed', bottom: 16, right: 16, displayPrint: "none" }}>
        <KeyboardArrowUp />
      </Fab>
    </Zoom >
  );
}

const TopAppBar: React.FC = () => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const showPrintButton = !!['/edit', '/view', '/playground'].find(path => pathname.startsWith(path));
  const showDrawerButton = !!['/edit', '/view'].find(path => pathname.startsWith(path));
  const initialized = useSelector(state => state.ui.initialized);
  const user = useSelector(state => state.user);

  const handlePrint = () => { window.print(); }
  const toggleDrawer = () => { dispatch(actions.toggleDrawer()); }

  useEffect(() => {
    if (!initialized) dispatch(actions.load());
  }, []);

  return (
    <>
        <AppBar sx={{ displayPrint: "none" }}>
          <Toolbar id="app-toolbar">
            <Link component={RouterLink} prefetch={false} href="/" sx={{ textDecoration: "none" }}>
              <Box sx={{ display: "flex" }}>
                <Image src={logo} alt="Logo" width={32} height={32} priority />
                <Typography variant="h6" component="h1" sx={{ marginInlineStart: 2, color: "white" }}>Math Editor</Typography>
              </Box>
            </Link>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton component={RouterLink} prefetch={false} href="/dashboard" aria-label="Dashboard">
              <Avatar alt={user?.name} src={user?.image ?? undefined} sx={{ width: 30, height: 30 }} />
            </IconButton>
            {showPrintButton && <IconButton aria-label="Print" color="inherit" onClick={handlePrint}>
              <Print />
            </IconButton>}
            {showDrawerButton && <IconButton id="document-info" aria-label="Document Info" color='inherit' onClick={toggleDrawer}
              sx={{ '& >.MuiBadge-root': { height: '1em', userSelect: 'none', zIndex: -1 } }} ><Info /></IconButton>}
          </Toolbar>
        </AppBar>
      <Toolbar id="back-to-top-anchor" sx={{ displayPrint: "none" }} />
      <ScrollTop />
    </>
  );
};

export default TopAppBar;