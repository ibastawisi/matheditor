import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { validate } from 'uuid';
import { SerializedEditorState } from 'lexical';
import { showLoading, hideLoading } from 'react-redux-loading-bar';
import { createDocument, deleteDocument, getAllDocuments, getAllUsers, getAuthenticatedUser, getDocument, logout, updateDocument } from '../services';
import { RootState } from '../store';
import documentDB from '../db';
import { GraphType } from '../lexical/nodes/GraphNode';

export interface Alert {
  title: string;
  content: string;
  action?: string;
}
export interface Announcement {
  message: string;
  action?: {
    label: string
    onClick: string
  }
  timeout?: number
}
export interface AppState {
  documents: UserDocument[];
  user: User | null;
  ui: {
    isLoading: boolean;
    isSaving: boolean;
    announcements: Announcement[],
    alerts: Alert[],
    dialogs: {
      image?: { open: boolean };
      graph?: { open: boolean; type: GraphType; };
      sketch?: { open: boolean };
      table?: { open: boolean };
    }
  };
  admin: {
    users: User[]
    documents: AdminDocument[]
  } | null;
}

export interface EditorDocument {
  id: string;
  name: string;
  data: SerializedEditorState;
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
}
export type DocumentWithUserId = UserDocument & { userId: string };
export type DocumentWithAuthor = UserDocument & { author: User };
export type AdminDocument = DocumentWithUserId & DocumentWithAuthor;
export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  admin: boolean;
  createdAt: string;
  updatedAt: string;
  documents: UserDocument[];
}

export type UserDocument = Omit<EditorDocument, "data">;

const initialState: AppState = {
  documents: [],
  user: null,
  ui: {
    isLoading: true,
    isSaving: false,
    announcements: [],
    alerts: [],
    dialogs: {
      image: { open: false },
      graph: { open: false, type: GraphType["2D"] },
      sketch: { open: false },
      table: { open: false }
    }
  },
  admin: null,
};

export const loadUserAsync = createAsyncThunk('app/loadUser', async (_, thunkAPI) => {
  thunkAPI.dispatch(showLoading())
  try {
    const response = await getAuthenticatedUser()
    return response
  } catch (error: any) {
    const message = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  } finally {
    thunkAPI.dispatch(hideLoading())
  }
});

export const loadDocumentsAsync = createAsyncThunk('app/loadDocuments', async (_, thunkAPI) => {
  thunkAPI.dispatch(showLoading())
  try {
    const documents = await documentDB.getAll();
    const userDocuments = documents.map(document => {
      const { data, ...userDocument } = document;
      return userDocument;
    }).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    return userDocuments;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
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
    const message = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
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
    const message: string = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
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
    const message: string = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
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
    const message = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  } finally {
    thunkAPI.dispatch(hideLoading())
  }
});

export const loadAdminAsync = createAsyncThunk('app/loadAdmin', async (_, thunkAPI) => {
  thunkAPI.dispatch(showLoading())
  try {
    const [users, documents] = await Promise.all([getAllUsers(), getAllDocuments()]);
    const response = { users, documents: documents.map(document => ({ ...document, author: users.find(user => user.id === document.userId) || { name: "Unknown" } as User })) };
    return response
  } catch (error: any) {
    const message = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  } finally {
    thunkAPI.dispatch(hideLoading())
  }
});

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    loadConfig: (state) => {
      // migrate from localStorage to indexeddb
      try {
        localStorage.removeItem('editor');
        const documents = Object.keys({ ...localStorage }).filter((key: string) => validate(key));
        documents.forEach(key => {
          const document = JSON.parse(localStorage.getItem(key) as string);
          documentDB.add(document).then(() => localStorage.removeItem(key));
        });
      } catch (error) {
        console.error("migration to indexeddb failed: " + error);
      }
      state.ui = { ...initialState.ui, isLoading: false };
    },
    loadDocument: (state, action: PayloadAction<EditorDocument>) => {
      if (!state.documents.find(d => d.id === action.payload.id)) {
        const documents = state.documents.filter(d => d.id !== action.payload.id);
        const { data, ...userDocument } = action.payload;
        documents.unshift(userDocument);
        state.documents = documents;
        documentDB.getByID(action.payload.id).then((document) => {
          if (!document) {
            documentDB.add(action.payload);
          }
        });
      }
    },
    saveDocument: (state, action: PayloadAction<EditorDocument>) => {
      const document = action.payload;
      documentDB.update(document);
      const userDocument = state.documents.find(d => d.id === document.id);
      if (userDocument) {
        userDocument.updatedAt = document.updatedAt;
      }
    },
    addDocument: (state, action: PayloadAction<EditorDocument>) => {
      documentDB.add(action.payload);
      const { data, ...userDocument } = action.payload;
      state.documents.unshift(userDocument);
    },
    deleteDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(d => d.id !== action.payload);
      documentDB.deleteByID(action.payload);
    },
    announce: (state, action: PayloadAction<Announcement>) => {
      state.ui.announcements.push(action.payload);
    },
    clearAnnouncement: (state) => {
      state.ui.announcements.shift();
    },
    alert: (state, action: PayloadAction<Alert>) => {
      state.ui.alerts.push(action.payload);
    },
    clearAlert: (state) => {
      state.ui.alerts.shift();
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    setDialogs: (state, action: PayloadAction<AppState["ui"]["dialogs"]>) => {
      state.ui.dialogs = { ...state.ui.dialogs, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserAsync.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logoutAsync.fulfilled, (state, action) => {
        state.user = null;
      })
      .addCase(loadDocumentsAsync.fulfilled, (state, action) => {
        state.documents = action.payload;
      })
      .addCase(getDocumentAsync.rejected, (state, action) => {
        const message = action.payload as string;
        state.ui.announcements.push({ message });
      })
      .addCase(uploadDocumentAsync.fulfilled, (state, action) => {
        if (state.user && action.payload) {
          state.user.documents = state.user.documents.filter(doc => doc.id !== action.payload!.id);
          state.user.documents.unshift(action.payload);
        }
      })
      .addCase(uploadDocumentAsync.rejected, (state, action) => {
        const message = action.payload as string;
        state.ui.announcements.push({ message });
      })
      .addCase(deleteDocumentAsync.fulfilled, (state, action) => {
        if (state.user) {
          state.user.documents = state.user.documents.filter(doc => doc.id !== action.payload);
        }
      })
      .addCase(deleteDocumentAsync.rejected, (state, action) => {
        const message = action.payload as string;
        state.ui.announcements.push({ message });
      })
      .addCase(loadAdminAsync.fulfilled, (state, action) => {
        state.admin = action.payload;
      })
  }
});

export default appSlice.reducer;