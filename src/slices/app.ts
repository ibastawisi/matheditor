import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Announcement } from '../Announcer';
import { OutputData } from '@editorjs/editorjs';
import { validate } from 'uuid';

export interface AppState {
  announcement: Announcement | null;
  editor: EditorDocument;
  documents: string[];
  ui: {
    isLoading: boolean;
    isSaving: boolean;
  };
}

export interface EditorDocument {
  id: string;
  name: string;
  data: OutputData;
  timestamp: number;
}

const initialState: AppState = {
  announcement: null,
  editor: {} as EditorDocument,
  documents: [] as string[],
  ui: {
    isLoading: true,
    isSaving: false,
  }
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    load: (state) => {
      state.documents = Object.keys({ ...localStorage }).filter((key: string) => validate(key));
      state.editor = JSON.parse(localStorage.getItem('editor') || '{}');
      state.ui.isLoading = false;
      state.announcement = null;
    },
    loadDocument: (state, action: PayloadAction<EditorDocument>) => {
      state.editor = action.payload;
      window.localStorage.setItem("editor", JSON.stringify(action.payload));
      !state.documents.includes(action.payload.id) && state.documents.push(action.payload.id);
    },
    saveDocument: (state, action: PayloadAction<OutputData>) => {
      state.editor.data = action.payload;
      window.localStorage.setItem("editor", JSON.stringify(state.editor));
      window.localStorage.setItem(state.editor.id, JSON.stringify(state.editor));
    },
    deleteDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(key => key !== action.payload);
      window.localStorage.removeItem(action.payload);
    },
    announce: (state, action: PayloadAction<Announcement>) => {
      state.announcement = action.payload
    },
    clearAnnouncement: (state) => {
      state.announcement = null
    }
  },
});

export default appSlice.reducer;