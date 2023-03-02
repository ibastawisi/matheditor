import './index.css';
import App from './components/App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { Provider } from 'react-redux';
import { store } from './store';
import { BrowserRouter } from "react-router-dom";

import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import reportWebVitals from './reportWebVitals';
import { sendToVercelAnalytics } from './analytics';

const container = document.getElementById('root');
const root = createRoot(container!);
const isProduction = process.env.NODE_ENV === 'production';

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
      {isProduction && <Analytics mode='production' />}
    </BrowserRouter>
  </Provider>
);

if (isProduction) {
  serviceWorkerRegistration.register();
  reportWebVitals(sendToVercelAnalytics);
}