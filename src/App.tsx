import React, { useRef } from 'react';
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
import { useReactToPrint } from 'react-to-print';
import 'mathlive/dist/mathlive-fonts.css';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store';
import { actions } from './slices';
import IconButton from '@mui/material/IconButton';
import PrintIcon from '@mui/icons-material/Print';
import Fab from '@mui/material/Fab';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Zoom from '@mui/material/Zoom';
import Link from '@mui/material/Link';
import Logo from './logo.png';

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
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: RootState) => state.editor)

  const documentRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => documentRef.current,
    documentTitle: data.blocks[0].data.text || 'Untitled Document',
    onBeforePrint: async () => {
      const data = await window.editor.save();
      dispatch(actions.editor.save(data)); window.editor.readOnly.toggle();

      const frame = document.getElementById("printWindow") as HTMLIFrameElement;
      const content = frame.contentDocument;
      content?.body.replaceChildren(documentRef.current as any);

    },
    onAfterPrint: () => { remountEditor(); },
  });

  const [editorKey, setEditorKey] = React.useState(0);
  const remountEditor = () => setEditorKey(editorKey + 1);

  return (
    <React.Fragment>
      <CssBaseline />
      <HideOnScroll>
        <AppBar>
          <Toolbar>
            <Link href="./">
              <Box sx={{ display: "flex" }}>
                <img src={Logo} alt="Logo" width={32} height={32} />
                <Typography variant="h6" component="div" sx={{ marginInlineStart: 2, color: "white" }}>Math Editor</Typography>
              </Box>
            </Link>

            <Box sx={{ flexGrow: 1 }} />
            <IconButton size="large" aria-label="Print" color="inherit" onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Toolbar id="back-to-top-anchor" />
      <Container sx={{ mt: 3 }} key={editorKey}>
        <Box ref={documentRef} className="editor-wrapper">
          <Editor />
        </Box>
      </Container>
      <ScrollTop>
        <Fab color="secondary" size="small" aria-label="scroll back to top">
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
    </React.Fragment >
  );
}

export default App;
