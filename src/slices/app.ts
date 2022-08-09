import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Announcement } from '../components/Announcer';
import { validate } from 'uuid';
import { SerializedEditorState } from 'lexical';
import { showLoading, hideLoading } from 'react-redux-loading-bar';
import { createDocument, deleteDocument, getAuthenticatedUser, getDocument, logout, updateDocument } from '../services';
import { RootState } from '../store';

export interface AppState {
  announcement: Announcement | null;
  editor: EditorDocument;
  documents: Omit<EditorDocument, "data">[];
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
  createdAt: string;
  updatedAt: string;
  documents: Omit<EditorDocument, "data">[];
}

const initialState: AppState = {
  announcement: null,
  editor: {} as EditorDocument,
  documents: [] as Omit<EditorDocument, "data">[],
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

export const loadUserAsync = createAsyncThunk('app/loadUser', async (_, thunkAPI) => {
  thunkAPI.dispatch(showLoading())
  try {
    const response = await getAuthenticatedUser()
    return response
  } catch (error: any) {
    const message = error.response?.data.error || error.message;
    thunkAPI.dispatch(hideLoading())
    thunkAPI.dispatch(appSlice.actions.announce({ message }))
    return thunkAPI.rejectWithValue(error.error);
  } finally {
    thunkAPI.dispatch(hideLoading())
  }
});

export const logoutAsync = createAsyncThunk('app/logout', async (_, thunkAPI) => {
  try {
    thunkAPI.dispatch(showLoading())
    const response = await logout();
    return response;
  } catch (error: any) {
    const message = error.response?.data.error || error.message;
    thunkAPI.dispatch(appSlice.actions.announce({ message }))
    return thunkAPI.rejectWithValue(error.error);
  } finally {
    thunkAPI.dispatch(hideLoading())
  }
});

export const getDocumentAsync = createAsyncThunk('app/getDocument', async (id: string, thunkAPI) => {
  try {
    thunkAPI.dispatch(showLoading());
    const response = await getDocument(id);
    return response;
  } catch (error: any) {
    const message = error.response?.data.error || error.message;
    thunkAPI.dispatch(appSlice.actions.announce({ message }))
    return thunkAPI.rejectWithValue(error.error);
  } finally {
    thunkAPI.dispatch(hideLoading())
  }
});

export const uploadDocumentAsync = createAsyncThunk('app/uploadDocument', async (document: EditorDocument, thunkAPI) => {
  thunkAPI.dispatch(showLoading());
  const state = thunkAPI.getState() as RootState;
  const documents = state.app.user?.documents ?? [];
  try {
    documents.find(d => d.id === document.id) ? await updateDocument(document) : await createDocument(document);
    const { data, ...userDocument } = document;
    thunkAPI.fulfillWithValue(userDocument);
    return userDocument;
  } catch (error: any) {
    const message = error.response?.data.error || error.message;
    thunkAPI.dispatch(appSlice.actions.announce({ message }))
    return thunkAPI.rejectWithValue(error.error);
  } finally {
    thunkAPI.dispatch(hideLoading())
  }
});

export const deleteDocumentAsync = createAsyncThunk('app/deleteDocument', async (id: string, thunkAPI) => {
  try {
    thunkAPI.dispatch(showLoading());
    await deleteDocument(id);
    return id;
  } catch (error: any) {
    const message = error.response?.data.error || error.message;
    thunkAPI.dispatch(appSlice.actions.announce({ message }))
    return thunkAPI.rejectWithValue(error.error);
  } finally {
    thunkAPI.dispatch(hideLoading())
  }
});

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    load: (state) => {
      state.documents = Object.keys({ ...localStorage })
        .filter((key: string) => validate(key))
        .map((key: string) => {
          const { data, ...userDocument } = JSON.parse(localStorage.getItem(key) as string);
          return userDocument;
        })
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
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
      if (!state.documents.find(d => d.id === action.payload.id)) {
        const documents = state.documents.filter(d => d.id !== action.payload.id);
        const { data, ...userDocument } = action.payload;
        documents.unshift(userDocument);
        state.documents = documents;
        localStorage.setItem(action.payload.id, JSON.stringify(action.payload));
      }
    },
    saveDocument: (state, action: PayloadAction<SerializedEditorState>) => {
      state.editor.data = action.payload;
      state.editor.updatedAt = new Date().toISOString();
      window.localStorage.setItem("editor", JSON.stringify(state.editor));
      window.localStorage.setItem(state.editor.id, JSON.stringify(state.editor));
    },
    addDocument: (state, action: PayloadAction<EditorDocument>) => {
      window.localStorage.setItem(action.payload.id, JSON.stringify(action.payload));
      const { data, ...userDocument } = action.payload;
      state.documents.unshift(userDocument);
    },
    deleteDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(d => d.id !== action.payload);
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserAsync.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logoutAsync.fulfilled, (state, action) => {
        state.user = null;
      })
      .addCase(uploadDocumentAsync.fulfilled, (state, action) => {
        if (state.user && action.payload) {
          state.user.documents = state.user.documents.filter(doc => doc.id !== action.payload!.id);
          state.user.documents.push(action.payload);
        }
      })
      .addCase(deleteDocumentAsync.fulfilled, (state, action) => {
        if (state.user) {
          state.user.documents = state.user.documents.filter(doc => doc.id !== action.payload);
        }
      })
  }
});

export default appSlice.reducer;