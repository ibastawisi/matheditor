import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Slide from '@mui/material/Slide';
import IconButton from '@mui/material/IconButton';
import PrintIcon from '@mui/icons-material/Print';
import Fab from '@mui/material/Fab';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import NewIcon from '@mui/icons-material/AddCircle';
import SaveIcon from '@mui/icons-material/Save';
import ShareIcon from '@mui/icons-material/Share';
import OpenIcon from '@mui/icons-material/FolderOpen';
import Zoom from '@mui/material/Zoom';
import Link from '@mui/material/Link';
import Logo from '../logo.png';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../slices';
import { AppDispatch, RootState } from '../store';

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
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        {children}
      </Box>
    </Zoom>
  );
}

const TopAppBar: React.FC<{}> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const document = useSelector((state: RootState) => state.app.document);
  const location = useLocation();
  
  async function saveToLocalStorage() {
    const data = await window.editor.save();
    dispatch(actions.app.saveDocument(data));
    window.localStorage.setItem(document.id, JSON.stringify({ ...document, data }));
  }

  const copyLink = () => {
    const document = window.localStorage.getItem("document");
    const href = window.location.href;
    if (document) {
      navigator.clipboard.writeText(href.substring(0, href.lastIndexOf('/') + 1) + encodeURIComponent(document));
      dispatch(actions.app.announce({ message: "Link copied to clipboard" }));
    }
  };


  return (
    <>
      <HideOnScroll>
        <AppBar sx={{ displayPrint: "none" }}>
          <Toolbar>
            <Link component={RouterLink} to="/">
              <Box sx={{ display: "flex" }}>
                <img src={Logo} alt="Logo" width={32} height={32} />
                <Typography variant="h6" component="div" sx={{ marginInlineStart: 2, color: "white" }}>Math Editor</Typography>
              </Box>
            </Link>

            <Box sx={{ flexGrow: 1 }} />
            <IconButton size="large" aria-label="New" color="inherit" component={RouterLink} to="/new">
              <NewIcon />
            </IconButton>
            <IconButton size="large" aria-label="Load" color="inherit" component={RouterLink} to="/open">
              <OpenIcon />
            </IconButton>
            {location.pathname.startsWith("/edit") && <>
              <IconButton size="large" aria-label="Save" color="inherit" onClick={saveToLocalStorage}>
                <SaveIcon />
              </IconButton>
              <IconButton size="large" aria-label="Share" color="inherit" onClick={copyLink}>
                <ShareIcon />
              </IconButton>
              <IconButton size="large" aria-label="Print" color="inherit" onClick={window.print}>
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
    </>
  );
};

export default TopAppBar;