import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Announcement } from '../Announcer';
import { v4 as uuidv4 } from "uuid";

export interface AppState {
  announcement: Announcement | null;
  document: EditorDocument;
}
export interface EditorDocument {
 id: string ;
}

const document = window.localStorage.getItem("document");
const initialState: AppState = {
  announcement: null,
  document: document ? JSON.parse(document) : { id: uuidv4() }
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    newDocument: (state) => {
      state.document = { id: uuidv4() };
      window.localStorage.setItem("document", JSON.stringify(state.document));
    },
    loadDocument: (state, action: PayloadAction<string>) => {
      state.document.id = action.payload;
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