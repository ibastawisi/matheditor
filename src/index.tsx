import './index.css';
import App from './components/App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import { sendToVercelAnalytics } from './analytics';
import { Provider } from 'react-redux';
import { store } from './store';
import { BrowserRouter } from "react-router-dom";

import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);

serviceWorkerRegistration.register();
reportWebVitals(sendToVercelAnalytics);
