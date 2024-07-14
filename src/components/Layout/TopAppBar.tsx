"use client"
import { usePathname } from 'next/navigation';
import RouterLink from 'next/link'
import { useEffect, useState } from 'react';
import logo from "@public/logo.svg";
import Image from 'next/image';
import { useDispatch, actions, useSelector } from '@/store';
import { useColorScheme } from '@mui/material/styles';
import { useScrollTrigger, Slide, Zoom, Box, AppBar, Toolbar, Typography, IconButton, Avatar, Fab, Link } from '@mui/material';
import { Brightness7, Brightness4, Print, KeyboardArrowUp, Info, BrightnessAuto } from '@mui/icons-material';
import { Helmet } from 'react-helmet';

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

const TopAppBar: React.FC = () => {
  const { mode, setMode } = useColorScheme();
  const dispatch = useDispatch();
  const pathname = usePathname();
  const showPrintButton = !!['/edit', '/view', '/playground', '/tutorial'].find(path => pathname.startsWith(path));
  const showDrawerButton = !!['/edit', '/view'].find(path => pathname.startsWith(path));
  const initialized = useSelector(state => state.ui.initialized);
  const user = useSelector(state => state.user);

  const toggleColorMode = () => {
    const modes = ['light', 'dark', 'system'];
    const nextMode = modes[(modes.indexOf(mode ?? 'system') + 1) % modes.length] as typeof mode;
    setMode(nextMode ?? 'light');
  }

  const handlePrint = () => { window.print(); }
  const toggleDrawer = () => { dispatch(actions.toggleDrawer()); }

  useEffect(() => {
    if (!initialized) dispatch(actions.load());
  }, []);

  return (
    <>
      <Helmet meta={[
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: mode === 'dark' ? '#272727' : '#1976d2' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: mode === 'light' ? '#1976d2' : '#272727' },
        { name: 'color-scheme', content: mode === 'system' ? 'light dark' : mode },
      ]} />
      < HideOnScroll >
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
            <IconButton onClick={toggleColorMode} color="inherit" aria-label='Toggle dark mode' key={!mode ? 'server' : 'client'}>
              <BrightnessIcon mode={mode} />
            </IconButton>
            {showPrintButton && <IconButton aria-label="Print" color="inherit" onClick={handlePrint}>
              <Print />
            </IconButton>}
            {showDrawerButton && <IconButton id="document-info" aria-label="Document Info" color='inherit' onClick={toggleDrawer}
              sx={{ '& >.MuiBadge-root': { height: '1em', userSelect: 'none', zIndex: -1 } }} ><Info /></IconButton>}
          </Toolbar>
        </AppBar>
      </HideOnScroll >
      <Toolbar id="back-to-top-anchor" sx={{ displayPrint: "none" }} />
      <ScrollTop />
    </>
  );
};

const BrightnessIcon: React.FC<{ mode?: string }> = ({ mode }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  if (!isClient) return <BrightnessAuto />;
  switch (mode) {
    case 'light': return <Brightness7 />;
    case 'dark': return <Brightness4 />;
    case 'system': return <BrightnessAuto />;
    default: return <BrightnessAuto />;
  }
}

export default TopAppBar;