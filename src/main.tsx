import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from "virtual:pwa-register";
import { Provider } from 'react-redux';
import { store } from './store';
import { BrowserRouter } from "react-router-dom";
import { Analytics } from '@vercel/analytics/react';
import reportWebVitals from './reportWebVitals';
import { sendToVercelAnalytics } from './analytics';
import { actions } from './slices';

// add this to prompt for a refresh
const updateSW = registerSW({
  onNeedRefresh() {
    updateSW(false);
    store.dispatch(actions.app.announce(
      {
        message: "New update available! Refresh to get the latest version",
        action: { label: "Refresh", onClick: "window.location.reload()" }
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