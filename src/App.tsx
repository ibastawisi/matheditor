/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import './App.css';
import Editor from './Editor';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
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
import OpenIcon from '@mui/icons-material/FolderOpen';
import Zoom from '@mui/material/Zoom';
import Link from '@mui/material/Link';
import Logo from './logo.png';
import Announcer from './Announcer';
import { useDispatch, useSelector } from 'react-redux';
import useLocalStorage from './hooks/useLocalStorage';
import { AppDispatch, RootState } from './store';
import { actions } from './slices';
import { EditorDocument } from './slices/app';
import Modal from '@mui/material/Modal';
import { Button } from '@mui/material';

const version = process.env.REACT_APP_VERSION || 'dev'

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


function App() {
  const document = useSelector((state: RootState) => state.app.document);
  const [storedDocument, setStoredDocument] = useLocalStorage<EditorDocument | null>("document", null);
  const dispatch = useDispatch<AppDispatch>();

  const [modalOpen, setModalOpen] = React.useState(false);
  const handleOpen = () => {
    setModalOpen(true);
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
  };

  const handleNew = () => {
    dispatch(actions.app.newDocument());
  };

  React.useEffect(() => {
    if (document.id !== storedDocument?.id) {
      setStoredDocument(document);
    }
  }, []);

  async function saveToLocalStorage() {
    const data = await window.editor.save();
    window.localStorage.setItem(document.id, JSON.stringify(data));
  }

  const loadDocument = (id: string) => {
    dispatch(actions.app.loadDocument(id));
    setModalOpen(false);
  };

  return (
    <React.Fragment>
      <CssBaseline />
      <HideOnScroll>
        <AppBar sx={{ displayPrint: "none" }}>
          <Toolbar>
            <Link href="./">
              <Box sx={{ display: "flex" }}>
                <img src={Logo} alt="Logo" width={32} height={32} />
                <Typography variant="h6" component="div" sx={{ marginInlineStart: 2, color: "white" }}>Math Editor</Typography>
              </Box>
            </Link>

            <Box sx={{ flexGrow: 1 }} />
            <IconButton size="large" aria-label="New" color="inherit" onClick={handleNew}>
              <NewIcon />
            </IconButton>
            <IconButton size="large" aria-label="Load" color="inherit" onClick={handleOpen}>
              <OpenIcon />
            </IconButton>
            <IconButton size="large" aria-label="Save" color="inherit" onClick={saveToLocalStorage}>
              <SaveIcon />
            </IconButton>
            <IconButton size="large" aria-label="Print" color="inherit" onClick={window.print}>
              <PrintIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Toolbar id="back-to-top-anchor" sx={{ displayPrint: "none" }} />
      <Container className='editor-container'>
        <Box className="editor-wrapper">
          <Editor key={document.id} />
        </Box>

      </Container>
        <Box component="footer" sx={{ displayPrint: "none", mt: "auto", p: 1, textAlign: "end" }}>
          Math Editor: {version}
        </Box>
              <ScrollTop>
        <Fab color="secondary" size="small" aria-label="scroll back to top">
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
      <Announcer />
      <Modal
        open={modalOpen}
        aria-labelledby="load-modal-title"
      >
        <Box sx={modalStyle}>
          <Typography id="load-modal-title" variant="h6" component="h2">
            Load from Local Storage
          </Typography>
          {Object.keys({ ...localStorage }).map((key) => (
            key !== "document" && <Button sx={{ p: 2, mt: 2, border: '1px dashed grey' }} key={key} onClick={() => loadDocument(key)}>{key}</Button>
          ))}
        </Box>
      </Modal>
    </React.Fragment >
  );
}

export default App;
