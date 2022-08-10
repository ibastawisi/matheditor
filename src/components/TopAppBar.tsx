import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Slide from '@mui/material/Slide';
import IconButton from '@mui/material/IconButton';
import PrintIcon from '@mui/icons-material/Print';
import Fab from '@mui/material/Fab';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import OpenIcon from '@mui/icons-material/FolderOpen';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Zoom from '@mui/material/Zoom';
import Link from '@mui/material/Link';
import Logo from '../logo.png';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useContext, useState } from 'react';
import { ColorModeContext } from './ThemeProvider';
import useTheme from '@mui/material/styles/useTheme';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SettingsDialog from './SettingsDialog';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Avatar from '@mui/material/Avatar';
import { BACKEND_URL } from '../config';
import LoadingBar from 'react-redux-loading-bar'

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
        sx={{ position: 'fixed', bottom: 24, right: 16, zIndex: 1200, displayPrint: "none" }}
      >
        {children}
      </Box>
    </Zoom>
  );
}

const TopAppBar: React.FC<{}> = () => {
  const location = useLocation();
  const colorMode = useContext(ColorModeContext);
  const theme = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const user = useSelector((state: RootState) => state.app.user);

  const login = async () => {
    const googleLoginURL = BACKEND_URL + "/auth/login";
    window.open(googleLoginURL, "_blank", "width=500,height=600");
  };

  const openSettingsDialog = () => {
    setSettingsOpen(true);
  };

  const closeSettingsDialog = () => {
    setSettingsOpen(false);
  };

  const showPrint = location.pathname.startsWith('/view') || location.pathname.startsWith("/edit") || location.pathname.startsWith("/playground");

  return (
    <>
      <LoadingBar className='loading-bar' style={{ position: 'fixed' }} />
      <HideOnScroll>
        <AppBar sx={{ displayPrint: "none", zIndex: 1200 }}>
          <Toolbar>
            <Link component={RouterLink} to="/">
              <Box sx={{ display: "flex" }}>
                <img src={Logo} alt="Logo" width={32} height={32} />
                <Typography variant="h6" component="div" sx={{ marginInlineStart: 2, color: "white" }}>Math Editor</Typography>
              </Box>
            </Link>
            <Box sx={{ flexGrow: 1 }} />
            {user ? <IconButton onClick={openSettingsDialog} size="small">
              <Avatar alt={user.name} src={user.picture} sx={{ width: 30, height: 30 }} />
            </IconButton> :
              <IconButton aria-label="account of current user" onClick={login} color="inherit">
                <ManageAccountsIcon />
              </IconButton>}
            <IconButton onClick={colorMode.toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <IconButton aria-label="Load" color="inherit" component={RouterLink} to="/open">
              <OpenIcon />
            </IconButton>
            {showPrint && <IconButton aria-label="Print" color="inherit" onClick={window.print}>
              <PrintIcon />
            </IconButton>
            }
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