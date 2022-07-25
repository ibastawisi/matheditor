import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Announcement } from '../components/Announcer';
import { validate } from 'uuid';
import { SerializedEditorState } from 'lexical';

export interface AppState {
  announcement: Announcement | null;
  editor: EditorDocument;
  documents: string[];
  user: User | null;
  ui: {
    isLoading: boolean;
    isSaving: boolean;
  };
  config: {
    editor: {
      debug: boolean;
    };
  };
}

export interface EditorDocument {
  id: string;
  name: string;
  data: SerializedEditorState;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  picture: string;
  googleId: string;
  createdAt: string;
  updatedAt: string;
  documents: Omit<EditorDocument,"data">[];
}

const initialState: AppState = {
  announcement: null,
  editor: {} as EditorDocument,
  documents: [] as string[],
  user: null,
  ui: {
    isLoading: true,
    isSaving: false,
  },
  config: {
    editor: {
      debug: false,
    },
  },
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    load: (state) => {
      state.documents = Object.keys({ ...localStorage }).filter((key: string) => validate(key));
      state.editor = JSON.parse(localStorage.getItem('editor') || '{}');
      try {
        const localConfig = localStorage.getItem('config')
        state.config = { ...initialState.config, ...JSON.parse(localConfig || '{}') };
      } catch (e) { console.error("couldn't parse saved config: " + e); }
      state.ui.isLoading = false;
      state.announcement = null;
    },
    loadDocument: (state, action: PayloadAction<EditorDocument>) => {
      state.editor = action.payload;
      window.localStorage.setItem("editor", JSON.stringify(action.payload));
      !state.documents.includes(action.payload.id) && state.documents.push(action.payload.id);
    },
    saveDocument: (state, action: PayloadAction<SerializedEditorState>) => {
      state.editor.data = action.payload;
      state.editor.updatedAt = new Date().toISOString();
      window.localStorage.setItem("editor", JSON.stringify(state.editor));
      window.localStorage.setItem(state.editor.id, JSON.stringify(state.editor));
    },
    addDocument: (state, action: PayloadAction<EditorDocument>) => {
      window.localStorage.setItem(action.payload.id, JSON.stringify(action.payload));
      !state.documents.includes(action.payload.id) && state.documents.push(action.payload.id);
    },
    deleteDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(key => key !== action.payload);
      if (state.editor.id === action.payload) {
        state.editor = { ...initialState.editor };
        window.localStorage.removeItem("editor");
      }
      window.localStorage.removeItem(action.payload);
    },
    announce: (state, action: PayloadAction<Announcement>) => {
      state.announcement = action.payload
    },
    clearAnnouncement: (state) => {
      state.announcement = null
    },
    setConfig: (state, action: PayloadAction<AppState["config"]>) => {
      state.config = action.payload;
      window.localStorage.setItem("config", JSON.stringify(state.config));
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    updateUserDocument: (state, action: PayloadAction<Omit<EditorDocument, "data">>) => {
      if (state.user) {
        state.user.documents = state.user.documents.filter(doc => doc.id !== action.payload.id);
        state.user.documents.push(action.payload);
      }
    },
    deleteUserDocument: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.documents = state.user.documents.filter(doc => doc.id !== action.payload);
      }
    }
  },
});

export default appSlice.reducer;