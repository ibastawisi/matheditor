"use client"
import { useDispatch, actions } from '@/store';
import { useEffect } from "react";
import type { Workbox } from 'workbox-window';

declare global {
  interface Window {
    workbox: Workbox;
  }
}

const PwaUpdater = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;
      wb.addEventListener("waiting", () => {
        wb.messageSkipWaiting();
       });
      wb.addEventListener("controlling", (event) => {
        const origin = location.origin;
        const urlsToCache = [
          [`${origin}/`, { headers: { "update": "1" } }],
          [`${origin}/?_rsc`, { headers: { "update": "1", "RSC": "1" } }],
          [`${origin}/playground`, { headers: { "update": "1" } }],
          [`${origin}/playground?_rsc`, { headers: { "update": "1", "RSC": "1" } }],
          [`${origin}/tutorial`, { headers: { "update": "1" } }],
          [`${origin}/tutorial?_rsc`, { headers: { "update": "1", "RSC": "1" } }],
          [`${origin}/new`, { headers: { "update": "1" } }],
          [`${origin}/new?_rsc`, { headers: { "update": "1", "RSC": "1" } }],
          [`${origin}/edit`, { headers: { "update": "1" } }],
          [`${origin}/edit?_rsc`, { headers: { "update": "1", "RSC": "1" } }],
          [`${origin}/dashboard`, { headers: { "update": "1" } }],
          [`${origin}/dashboard?_rsc`, { headers: { "update": "1", "RSC": "1" } }],
          [`${origin}/privacy`, { headers: { "update": "1" } }],
          [`${origin}/privacy?_rsc`, { headers: { "update": "1", "RSC": "1" } }],
        ]
        wb.messageSW({ type: "CACHE_URLS", payload: { urlsToCache } }).then(() => {
          dispatch(actions.announce({
            message: event.isUpdate ? { title: "App Updated", subtitle: "Please refresh to see the latest version" } : { title: "App Ready", subtitle: "Content is cached for offline use" },
            timeout: 6000,
            action: {
              label: "Refresh",
              onClick: "window.location.reload()"
            }
          }));
        });
      });

      wb.register();
    }
  }, []);

  return null;
}

export default PwaUpdater;