"use client"
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from 'react';
import SplashScreen from "./SplashScreen";

const Home = lazy(() => import('@/components/Home'));
const NewDocument = lazy(() => import('@/components/NewDocument'));
const Privacy = lazy(() => import('@/components/Privacy'));
const Playground = lazy(() => import('@/components/Playground'));
const Tutorial = lazy(() => import('@/components/Tutorial'));
const Dashboard = lazy(() => import('@/components/Dashboard'));
const EditDocument = lazy(() => import('@/components/EditDocument'));
const ViewDocument = lazy(() => import('@/components/ViewDocument'));
const User = lazy(() => import('@/components/User'));

function App() {

  const id = location.pathname.split('/')[2];
  const params = { id };

  return (
    <Suspense fallback={<SplashScreen />}>
      <BrowserRouter>
        <Routes>
          <Route path="/new" element={<NewDocument />}>
            <Route path=":id" element={<NewDocument params={params} />} />
          </Route>
          <Route path="/edit/:id" element={<EditDocument params={params} />} />
          <Route path="/view/:id" element={<ViewDocument params={params} />} />
          <Route path="/user/:id" element={<User />} />
          <Route path="playground" element={<Playground />} />
          <Route path="tutorial" element={<Tutorial />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </Suspense>
  );
}

export default App;