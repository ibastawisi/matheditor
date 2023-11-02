"use client"
import { usePathname } from 'next/navigation';
import RouterLink from 'next/link'
import { useContext, useEffect } from 'react';
import { ColorModeContext } from '@/components/ThemeProvider';
import logo from "@public/logo.svg";
import Image from 'next/image';
import { useDispatch, actions, useSelector } from '@/store';
import { useTheme } from '@mui/material/styles';
import { useScrollTrigger, Slide, Zoom, Box, AppBar, Toolbar, Typography, IconButton, Avatar, Fab, Link } from '@mui/material';
import { Brightness7, Brightness4, Print, KeyboardArrowUp, Info } from '@mui/icons-material';

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
  const initialized = useSelector(state => state.initialized);
  const user = useSelector(state => state.user);

  const handlePrint = () => { window.print(); }
  const toggleDrawer = () => { dispatch(actions.toggleDrawer()); }

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
            {showDrawerButton && <IconButton aria-label="Document Info" color='inherit' onClick={toggleDrawer}><Info /></IconButton>}
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Toolbar id="back-to-top-anchor" sx={{ displayPrint: "none" }} />
      <ScrollTop />
    </>
  );
};

export default TopAppBar;