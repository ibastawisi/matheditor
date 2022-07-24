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
import { useDispatch, useSelector } from 'react-redux';
import Avatar from '@mui/material/Avatar';
import { actions } from '../slices';
import { AppDispatch, RootState } from '../store';
import { getAuthenticatedUser } from '../services';
// import ShareIcon from '@mui/icons-material/Share';
// import * as Service from '../services';

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
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1200, displayPrint: "none" }}
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
  const dispatch = useDispatch<AppDispatch>();
  const backendURL = process.env.NODE_ENV == 'production' ? "https://math-editor-server.herokuapp.com" : "http://localhost:3001";

  // const document = useSelector((state: RootState) => state.app.editor);
  // const handleShare = async () => {
  //   dispatch(actions.app.announce({ message: "Generating sharable link" }));
  //   try {
  //     await Service.post(document.id, JSON.stringify(document));
  //   } catch (e) {
  //     dispatch(actions.app.announce({ message: "Failed to generate sharable link" }));
  //     return;
  //   }
  //   const shareData = {
  //     title: document.name,
  //     url: window.location.origin + "/new/" + document.id
  //   }
  //   try {
  //     await navigator.share(shareData)
  //   } catch (err) {
  //     navigator.clipboard.writeText(shareData.url);
  //     dispatch(actions.app.announce({ message: "Link copied to clipboard" }));
  //   }
  // };

  const redirectToGoogleSSO = async () => {
    const googleLoginURL = backendURL + "/auth/login";
    window.open(googleLoginURL, "_blank", "width=500,height=600");
  };

  const fetchAuthUser = async () => {
    try {
      const user = await getAuthenticatedUser();
      dispatch(actions.app.setUser(user));
    } catch (error) {
      console.log("Not properly authenticated");
      dispatch(actions.app.setUser(null))
    }
  };

  window.addEventListener("message", (event) => {
    if (event.origin !== backendURL) {
      return;
    }
    if (event.data.type === "auth") {
      fetchAuthUser();
    }
  });

  const openSettingsDialog = () => {
    setSettingsOpen(true);
  };

  const closeSettingsDialog = () => {
    setSettingsOpen(false);
  };

  const isEditing = location.pathname.startsWith("/edit") || location.pathname.startsWith("/playground");

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
            {user ? <IconButton onClick={openSettingsDialog} size="small">
              <Avatar alt={user.name} src={user.picture} sx={{ width: 30, height: 30 }} />
            </IconButton> :
              <IconButton aria-label="account of current user" onClick={redirectToGoogleSSO} color="inherit">
                <ManageAccountsIcon />
              </IconButton>}
            <IconButton onClick={colorMode.toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <IconButton aria-label="Load" color="inherit" component={RouterLink} to="/open">
              <OpenIcon />
            </IconButton>
            {isEditing && <>
              {/* <IconButton aria-label="Share" color="inherit" onClick={handleShare}>
                <ShareIcon />
              </IconButton> */}
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