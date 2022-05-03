/* eslint-disable react-hooks/exhaustive-deps */
import './App.css';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import useMediaQuery from '@mui/material/useMediaQuery';
import Announcer from './Announcer';
import { Route, Routes } from "react-router-dom";
import TopAppBar from './components/TopAppBar';
import Footer from './components/Footer';
import Documents from './components/Documents';
import Home from './components/Home';
import NewDocument from './components/NewDocument';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import EditDocument from './components/EditDocument';
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './store';
import { actions } from './slices';
import SplashScreen from './components/SplachScreen';

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => state.app.ui.isLoading);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(() => createTheme({ palette: { mode: prefersDarkMode ? 'dark' : 'light' }}),[prefersDarkMode]); 

  useEffect(() => {
    dispatch(actions.app.load());
  }, []);

  return isLoading ? <SplashScreen /> : (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TopAppBar />
      <Container className='editor-container'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewDocument />}>
            <Route path=":id" element={<NewDocument />} />
          </Route>
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
