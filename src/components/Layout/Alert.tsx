"use client"
import { useCallback, useEffect, useRef, useState } from 'react';
import useFixedBodyScroll from '@/hooks/useFixedBodyScroll';
import { alertStore, type ResolveFunction } from '@/shared/alert';
import type { Alert } from '@/types';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

export default function AlertDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<Alert>({ title: "Are you sure?" });
  const resolvePromiseRef = useRef<ResolveFunction | null>(null);
  useFixedBodyScroll(isOpen);

  useEffect(() => {
    alertStore.showAlert = (newOptions, resolve) => {
      setOptions(newOptions);
      resolvePromiseRef.current = resolve || null;
      setIsOpen(true);
    };

    return () => {
      // if the dialog unmounts while an alert is open, resolve it as cancelled
      resolvePromiseRef.current?.(false);
      resolvePromiseRef.current = null;
      alertStore.showAlert = () => {
        console.warn("Alert function called after component was unmounted");
      };
    };
  }, []);

  const handleConfirm = useCallback(async () => {
    await options.onConfirm?.();
    resolvePromiseRef.current?.(true);
    resolvePromiseRef.current = null;
    setIsOpen(false);
  }, [options]);

  const handleCancel = useCallback(async () => {
    await options.onCancel?.();
    resolvePromiseRef.current?.(false);
    resolvePromiseRef.current = null;
    setIsOpen(false);
  }, [options]);

  return (
    <Dialog open={isOpen} onClose={handleCancel}>
      <DialogTitle>{options.title}</DialogTitle>
      {options.description && <DialogContent>
        <DialogContentText>{options.description}</DialogContentText>
      </DialogContent>}
      <DialogActions>
        <Button onClick={handleCancel}>{options.cancelText || "Cancel"}</Button>
        <Button onClick={handleConfirm} color={options.buttonVariant === "destructive" ? "error" : "primary"} autoFocus>
          {options.confirmText || "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
