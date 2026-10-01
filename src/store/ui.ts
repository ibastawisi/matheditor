import type { StateCreator } from 'zustand';
import type { Collaborator, CollabStatus } from '@/types';
import type { AppStore } from './store';

export interface Diff { open: boolean; old?: string; new?: string; }
/** The live session of the document being edited */
export interface Live { status: CollabStatus; collaborators: Collaborator[]; }

export interface UiSlice {
  initialized: boolean;
  drawer: boolean;
  page: number;
  diff: Diff;
  live: Live | null;
  toggleDrawer: (open?: boolean) => void;
  setPage: (page: number) => void;
  setDiff: (diff: Partial<Diff>) => void;
  setLive: (live: Partial<Live> | null) => void;
}

export const createUiSlice: StateCreator<AppStore, [], [], UiSlice> = (set) => ({
  initialized: false,
  drawer: false,
  page: 1,
  diff: { open: false },
  live: null,
  toggleDrawer: (open) => set(state => ({ drawer: open ?? !state.drawer })),
  setPage: (page) => set({ page }),
  setDiff: (diff) => set(state => ({ diff: { ...state.diff, ...diff } })),
  setLive: (live) => set(state => ({ live: live && { status: "connecting", collaborators: [], ...state.live, ...live } })),
});
