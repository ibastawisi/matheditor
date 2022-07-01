/* eslint-disable react-hooks/exhaustive-deps */
import './App.css';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Announcer from './components/Announcer';
import { Route, Routes } from "react-router-dom";
import TopAppBar from './components/TopAppBar';
import Footer from './components/Footer';
import Documents from './components/Documents';
import Home from './components/Home';
import NewDocument from './components/NewDocument';
import ThemeProvider from './components/ThemeProvider';
import EditDocument from './components/EditDocument';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './store';
import { actions } from './slices';
import SplashScreen from './components/SplachScreen';
import { Helmet } from 'react-helmet';
import Privacy from './Privacy';
import LexicalEditor from './lexical/Editor';

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => state.app.ui.isLoading);

  useEffect(() => {
    dispatch(actions.app.load());
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
          <Route path="/edit" element={<EditDocument />} >
            <Route path=":id" element={<EditDocument />} />
          </Route>
          <Route path="open" element={<Documents />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="lexical" element={<LexicalEditor />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Container>
      <Footer />
      <Announcer />
    </ThemeProvider >
  );
}

export default App;
