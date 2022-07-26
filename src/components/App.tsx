/* eslint-disable react-hooks/exhaustive-deps */
import './App.css';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Announcer from './Announcer';
import { Route, Routes } from "react-router-dom";
import TopAppBar from './TopAppBar';
import Footer from './Footer';
import Documents from './Documents';
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

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => state.app.ui.isLoading);

  useEffect(() => {
    dispatch(actions.app.load());
    dispatch(actions.app.loadUserAsync());
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
          <Route path="playground" element={<Playground />} />
          <Route path="privacy" element={<Privacy />} />
        </Routes>
      </Container>
      <Footer />
      <Announcer />
    </ThemeProvider >
  );
}

export default App;
