/* eslint-disable react-hooks/exhaustive-deps */
import './App.css';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Announcer from './Announcer';
import { Route, Routes } from "react-router-dom";
import TopAppBar from './TopAppBar';
import Footer from './Footer';
import Home from './Home';
import NewDocument from './NewDocument';
import ThemeProvider from './ThemeProvider';
import EditDocument from './EditDocument';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { actions } from '../slices';
import SplashScreen from './SplachScreen';
import { Helmet } from 'react-helmet';
import Privacy from './Privacy';
import Playground from './Playground';
import ViewDocument from './ViewDocument';
import { BACKEND_URL } from '../config';
import AlertDialog from './Alert';

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => state.app.ui.isLoading);

  useEffect(() => {
    dispatch(actions.app.loadUserAsync());
    dispatch(actions.app.loadDocumentsAsync());
    dispatch(actions.app.loadConfig());
    window.addEventListener("message", (event) => {
      if (event.origin !== BACKEND_URL) return;
      if (event.data.type === "auth") {
        dispatch(actions.app.loadUserAsync());
      }
    });
  }, []);

  return isLoading ? <SplashScreen /> : (
    <ThemeProvider>
      <Helmet defaultTitle="Math Editor"></Helmet>
      <CssBaseline />
      <TopAppBar />
      <Container className='editor-container'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewDocument />}>
            <Route path=":id" element={<NewDocument />} />
          </Route>
          <Route path="/edit/:id" element={<EditDocument />} />
          <Route path="/view/:id" element={<ViewDocument />} />
          <Route path="playground" element={<Playground />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Container>
      <Footer />
      <Announcer />
      <AlertDialog />
    </ThemeProvider >
  );
}

export default App;
