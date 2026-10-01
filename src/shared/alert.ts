import type { Alert } from '@/types';

export type ResolveFunction = (value: boolean) => void;

type AlertStore = {
  showAlert: (options: Alert, resolve?: ResolveFunction) => void;
};

// the mounted alert dialog replaces showAlert with one that opens it
export const alertStore: AlertStore = {
  showAlert: () => {
    console.warn("Alert function called before component was mounted");
  },
};

// opens the alert dialog and resolves with whether its confirm button was clicked
export function alert(options: Alert): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    alertStore.showAlert(options, resolve);
  });
}
