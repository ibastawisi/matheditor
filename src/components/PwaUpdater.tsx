"use client"
import { AppDispatch, actions } from "@/store";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { Workbox } from 'workbox-window';

declare global {
  interface Window {
    workbox: Workbox;
  }
}

const PwaUpdater = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {

      const wb = window.workbox;

      wb.addEventListener("waiting", () => {
        dispatch(actions.announce(
          {
            message: "New update available!",
            action: {
              label: "Apply update", onClick: "window.workbox.messageSkipWaiting(); window.workbox.addEventListener('controlling', () => window.location.reload());"
            },
            timeout: 6000
          }
        ));
      });

      wb.register();
    }

  }, []);

  return null;
}

export default PwaUpdater;