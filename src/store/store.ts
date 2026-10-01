import { createStore } from 'zustand/vanilla';
import { createUiSlice, type UiSlice } from './ui';
import { createUserSlice, type UserSlice } from './user';
import { createDocumentsSlice, type DocumentsSlice } from './documents';

export type AppStore = UiSlice & UserSlice & DocumentsSlice & {
  load: () => Promise<void>;
};

export const createAppStore = () => createStore<AppStore>()((...a) => {
  const [set, get] = a;
  return {
    ...createUiSlice(...a),
    ...createUserSlice(...a),
    ...createDocumentsSlice(...a),
    load: async () => {
      const { loadSession, loadLocalDocuments, loadCloudDocuments } = get();
      await Promise.allSettled([loadSession(), loadLocalDocuments(), loadCloudDocuments()]);
      set(state => ({
        documents: [...state.documents].sort((a, b) => {
          const first = a.local?.updatedAt || a.cloud?.updatedAt;
          const second = b.local?.updatedAt || b.cloud?.updatedAt;
          if (!first && !second) return 0;
          if (!first) return 1;
          if (!second) return -1;
          return new Date(second).getTime() - new Date(first).getTime();
        }),
        initialized: true,
      }));
    },
  };
});

export type AppStoreApi = ReturnType<typeof createAppStore>;
