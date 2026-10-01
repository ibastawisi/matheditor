import type { StateCreator } from 'zustand';
import type { AppStore } from './store';

export interface Diff { open: boolean; old?: string; new?: string; }

export interface UiSlice {
  initialized: boolean;
  drawer: boolean;
  page: number;
  diff: Diff;
  toggleDrawer: (open?: boolean) => void;
  setPage: (page: number) => void;
  setDiff: (diff: Partial<Diff>) => void;
}

export const createUiSlice: StateCreator<AppStore, [], [], UiSlice> = (set) => ({
  initialized: false,
  drawer: false,
  page: 1,
  diff: { open: false },
  toggleDrawer: (open) => set(state => ({ drawer: open ?? !state.drawer })),
  setPage: (page) => set({ page }),
  setDiff: (diff) => set(state => ({ diff: { ...state.diff, ...diff } })),
});
