import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy } from 'react';

const App = lazy(() => import('./App'));
const Embed = lazy(() => import('./embed'));
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/embed/:id" element={<Embed />} />
      <Route path="*" element={<App />} />
    </Routes>
  </BrowserRouter>
)
