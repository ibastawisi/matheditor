"use client"
import { AppDispatch, actions } from "@/store";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

declare global {
  interface Window {
    workbox: {
      messageSkipWaiting(): void;
      register(): void;
      addEventListener(name: string, callback: () => unknown): void;
    }
  }
}

const PwaUpdater = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    window.workbox.addEventListener('controlling', () => {
      window.location.reload();
    });

    window.workbox.addEventListener('waiting', () => {
      dispatch(actions.announce(
        {
          message: "New update available!",
          action: { label: "Apply update", onClick: "window.workbox.messageSkipWaiting()" },
          timeout: 6000
        }
      ));
    });
    window.workbox.register();
  }, []);

  return null;
}

export default PwaUpdater;