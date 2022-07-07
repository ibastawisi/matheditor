import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Slide from '@mui/material/Slide';
import IconButton from '@mui/material/IconButton';
import PrintIcon from '@mui/icons-material/Print';
import Fab from '@mui/material/Fab';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ShareIcon from '@mui/icons-material/Share';
import OpenIcon from '@mui/icons-material/FolderOpen';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Zoom from '@mui/material/Zoom';
import Link from '@mui/material/Link';
import Logo from '../logo.png';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../slices';
import { AppDispatch, RootState } from '../store';
import { useContext, useState } from 'react';
import { ColorModeContext } from './ThemeProvider';
import useTheme from '@mui/material/styles/useTheme';
import * as Service from '../services';
import SettingsIcon from '@mui/icons-material/Settings';
import SettingsDialog from './SettingsDialog';

function HideOnScroll({ children }: { children: React.ReactElement }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>{children}</Slide>
  );
}

function ScrollTop({ children }: { children: React.ReactElement }) {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event: React.MouseEvent) => {
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
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1, displayPrint: "none" }}
      >
        {children}
      </Box>
    </Zoom>
  );
}

const TopAppBar: React.FC<{}> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const document = useSelector((state: RootState) => state.app.editor);
  const colorMode = useContext(ColorModeContext);
  const theme = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleShare = async () => {
    dispatch(actions.app.announce({ message: "Generating sharable link" }));
    try {
      await Service.post(document.id, JSON.stringify(document));
    } catch (e) {
      dispatch(actions.app.announce({ message: "Failed to generate sharable link" }));
      return;
    }
    const shareData = {
      title: document.name,
      url: window.location.origin + "/new/" + document.id
    }
    try {
      await navigator.share(shareData)
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      dispatch(actions.app.announce({ message: "Link copied to clipboard" }));
    }
  };

  const openSettingsDialog = () => {
    setSettingsOpen(true);
  };

  const closeSettingsDialog = () => {
    setSettingsOpen(false);
  };

  return (
    <>
      <HideOnScroll>
        <AppBar sx={{ displayPrint: "none", zIndex: 1111 }}>
          <Toolbar>
            <Link component={RouterLink} to="/">
              <Box sx={{ display: "flex" }}>
                <img src={Logo} alt="Logo" width={32} height={32} />
                <Typography variant="h6" component="div" sx={{ marginInlineStart: 2, color: "white" }}>Math Editor</Typography>
              </Box>
            </Link>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton onClick={openSettingsDialog} color="inherit">
              <SettingsIcon />
            </IconButton>
            <IconButton onClick={colorMode.toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <IconButton aria-label="Load" color="inherit" component={RouterLink} to="/open">
              <OpenIcon />
            </IconButton>
            {location.pathname.startsWith("/edit") && <>
              <IconButton aria-label="Share" color="inherit" onClick={handleShare}>
                <ShareIcon />
              </IconButton>
              <IconButton aria-label="Print" color="inherit" onClick={window.print}>
                <PrintIcon />
              </IconButton>
            </>}
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Toolbar id="back-to-top-anchor" sx={{ displayPrint: "none" }} />
      <ScrollTop>
        <Fab color="secondary" size="small" aria-label="scroll back to top">
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
      <SettingsDialog open={settingsOpen} onClose={closeSettingsDialog} />
    </>
  );
};

export default TopAppBar;