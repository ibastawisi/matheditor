/* eslint-disable react-hooks/exhaustive-deps */
import './App.css';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import { Route, Routes } from "react-router-dom";
import ThemeProvider from './components/ThemeProvider';
import { lazy, Suspense, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './store';
import { actions } from './slices';
import { Helmet } from 'react-helmet';
import { BACKEND_URL } from './config';

import TopAppBar from './components/TopAppBar';
import Footer from './components/Footer';
import Announcer from './components/Announcer';
import AlertDialog from './components/Alert';
import SplashScreen from './components/SplashScreen';

import Home from './components/Home';
import NewDocument from './components/NewDocument';
const Privacy = lazy(() => import('./components/Privacy'));
const Playground = lazy(() => import('./components/Playground'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const EditDocument = lazy(() => import('./components/EditDocument'));
const ViewDocument = lazy(() => import('./components/ViewDocument'));

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
        <Suspense fallback={<SplashScreen />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/new" element={<NewDocument />}>
              <Route path=":id" element={<NewDocument />} />
            </Route>
            <Route path="/edit/:id" element={<EditDocument />} />
            <Route path="/view/:id" element={<ViewDocument />} />
            <Route path="playground" element={<Playground />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </Container>
      <Footer />
      <Announcer />
      <AlertDialog />
    </ThemeProvider >
  );
}

export default App;
