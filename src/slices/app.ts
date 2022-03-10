import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Announcement } from '../Announcer';
import { OutputData } from '@editorjs/editorjs';

export interface AppState {
  announcement: Announcement | null;
  document: EditorDocument;
}
export interface EditorDocument {
  id: string;
  name: string;
  data: OutputData
}


const initialState: AppState = {
  announcement: null,
  document: {} as EditorDocument
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    loadDocument: (state, action: PayloadAction<EditorDocument>) => {
      state.document = action.payload;
      window.localStorage.setItem("document", JSON.stringify(state.document));
    },
    saveDocument: (state, action: PayloadAction<OutputData>) => {
      state.document.data = action.payload;
      window.localStorage.setItem("document", JSON.stringify(state.document));
      window.localStorage.setItem(state.document.id, JSON.stringify(state.document));
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