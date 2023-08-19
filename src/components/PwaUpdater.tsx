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
      wb.addEventListener("activated", (event) => {
        dispatch(actions.announce({ message: event.isUpdate ? "Update was installed." : "App is ready for offline use." }));
      });
      wb.addEventListener("installed", () => {
        const origin = location.origin;
        const urlsToCache = [
          `${origin}/`,
          [`${origin}/?_rsc`, { headers: { "RSC": "1" } }],
          `${origin}/playground`,
          [`${origin}/playground?_rsc`, { headers: { "RSC": "1" } }],
          `${origin}/tutorial`,
          [`${origin}/tutorial?_rsc`, { headers: { "RSC": "1" } }],
          `${origin}/new`,
          [`${origin}/new?_rsc`, { headers: { "RSC": "1" } }],
          `${origin}/edit`,
          [`${origin}/edit?_rsc`, { headers: { "RSC": "1" } }],
          `${origin}/dashboard`,
          [`${origin}/dashboard?_rsc`, { headers: { "RSC": "1" } }],
          `${origin}/privacy`,
          [`${origin}/privacy?_rsc`, { headers: { "RSC": "1" } }],
        ]
        wb.messageSW({ type: "CACHE_URLS", payload: { urlsToCache } }).then((event) => { wb.messageSkipWaiting() });
      });
      wb.register();
    }
  }, []);

  return null;
}

export default PwaUpdater;