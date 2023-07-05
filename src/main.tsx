import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { registerSW } from "virtual:pwa-register";
import { Provider } from 'react-redux';
import { BrowserRouter } from "react-router-dom";
import { Analytics } from '@vercel/analytics/react';
import reportWebVitals from './reportWebVitals';
import { sendToVercelAnalytics } from './analytics';
import { store, actions } from './store';

export const updateSW = registerSW({
  onNeedRefresh() {
    store.dispatch(actions.app.announce(
      {
        message: "New update available!",
        action: { label: "Apply update", onClick: "updateSW(true)" },
        timeout: 6000
      }
    ));
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
      {import.meta.env.PROD && <Analytics mode='production' />}
    </BrowserRouter>
  </Provider>
)

if (import.meta.env.PROD) {
  reportWebVitals(sendToVercelAnalytics);
}