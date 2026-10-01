"use client"
import { useEffect } from "react";
import { enqueueSnackbar } from 'notistack';
import { Button } from '@mui/material';
import type { Workbox } from 'workbox-window';

declare global {
  interface Window {
    workbox: Workbox;
  }
}

const PwaUpdater = () => {

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;
      wb.addEventListener("waiting", () => {
        wb.messageSkipWaiting()
      });
      wb.addEventListener("controlling", (event) => {
        enqueueSnackbar(event.isUpdate ? "Update Complete" : "App Installed", {
          description: "Please refresh to use the latest version",
          autoHideDuration: 6000,
          action: <Button color="secondary" size="small" onClick={() => window.location.reload()}>Refresh</Button>,
        });
      });

      wb.register().then((registration) => {
        if (!registration) return;
        registration.onupdatefound = () => {
          enqueueSnackbar("Downloading Update", {
            description: "App is being updated in the background",
            autoHideDuration: 3000,
          });
        }
      });
    }
  }, []);

  return null;
}

export default PwaUpdater;