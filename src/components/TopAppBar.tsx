"use client"
import { usePathname } from 'next/navigation';
import RouterLink from 'next/link'
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Slide from '@mui/material/Slide';
import IconButton from '@mui/material/IconButton';
import PrintIcon from '@mui/icons-material/Print';
import Fab from '@mui/material/Fab';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Zoom from '@mui/material/Zoom';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useContext, useEffect, useState } from 'react';
import { ColorModeContext } from '@/components/ThemeProvider';
import useTheme from '@mui/material/styles/useTheme';
import Avatar from '@mui/material/Avatar';
import logo from "/public/logo.svg";
import Image from 'next/image';
import { useDispatch, actions, useSelector } from '@/store';
import RestoreIcon from '@mui/icons-material/Restore';
import DocumentRevisions from './DocumentRevisions';

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

function ScrollTop({ children }: { children: React.ReactElement }) {
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
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1100, displayPrint: "none" }}
      >
        {children}
      </Box>
    </Zoom>
  );
}

const TopAppBar: React.FC<{}> = () => {
  const colorMode = useContext(ColorModeContext);
  const dispatch = useDispatch();
  const theme = useTheme();
  const pathname = usePathname();
  const showPrintButton = !!['/edit', '/view', '/playground', '/tutorial'].find(path => pathname.startsWith(path));
  const showRevisionButton = !!['/edit'].find(path => pathname.startsWith(path));
  const [revisionsDrawerOpen, setRevisionsDrawerOpen] = useState(false);
  const initialized = useSelector(state => state.initialized);
  const user = useSelector(state => state.user);

  const toggleRevisionsDrawer = () => { setRevisionsDrawerOpen(!revisionsDrawerOpen); };

  const handlePrint = () => { window.print(); }

  useEffect(() => { 
    if (!initialized) dispatch(actions.load());
   }, []);

  return (
    <>
      <HideOnScroll>
        <AppBar sx={{ displayPrint: "none", zIndex: 1200 }}>
          <Toolbar sx={{ minHeight: 64 }}>
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
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            {showPrintButton && <IconButton aria-label="Print" color="inherit" onClick={handlePrint}>
              <PrintIcon />
            </IconButton>}
            {showRevisionButton && <IconButton aria-label="Revisions" color='inherit' onClick={() => { toggleRevisionsDrawer() }}>
              <RestoreIcon />
            </IconButton>}
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Toolbar id="back-to-top-anchor" sx={{ displayPrint: "none" }} />
      <ScrollTop>
        <Fab color="secondary" size="small" aria-label="scroll back to top">
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
      <DocumentRevisions open={revisionsDrawerOpen} onClose={toggleRevisionsDrawer} />
    </>
  );
};

export default TopAppBar;