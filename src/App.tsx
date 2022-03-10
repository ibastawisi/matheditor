/* eslint-disable react-hooks/exhaustive-deps */
import './App.css';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';

import Announcer from './Announcer';
import { Route, Routes } from "react-router-dom";
import TopAppBar from './components/TopAppBar';
import Footer from './components/Footer';
import Documents from './components/Documents';
import Home from './components/Home';
import NewDocument from './components/NewDocument';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import EditDocument from './components/EditDocument';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TopAppBar />
      <Container className='editor-container'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewDocument />} />
          <Route path="/edit" element={<EditDocument />} >
            <Route path=":id" element={<EditDocument />} />
          </Route>
          <Route path="open" element={<Documents />} />
        </Routes>
      </Container>
      <Footer />
      <Announcer />
    </ThemeProvider >
  );
}

export default App;
