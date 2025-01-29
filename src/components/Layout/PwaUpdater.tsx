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
        dispatch(actions.announce({
          message:
          {
            title: event.isUpdate ? "Update Complete" : "App Installed",
            subtitle: "Please refresh to use the latest version"
          },
          timeout: 6000,
          action: {
            label: "Refresh",
            onClick: "window.location.reload()"
          }
        }));
      });

      wb.register().then((registration) => {
        if (!registration) return;
        registration.onupdatefound = () => {
          dispatch(actions.announce({
            message: {
              title: "Downloading Update",
              subtitle: "App is being updated in the background"
            },
            timeout: 3000
          }));
        }
      });
    }
  }, []);

  return null;
}

export default PwaUpdater;