"use client"
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createDocument, deleteDocument, getAllDocuments, getAllUsers, getAuthenticatedUser, getDocument, logout, updateDocument } from '@/service';
import documentDB from '@/indexeddb';
import { AppState, Announcement, Alert, EditorDocument, User } from '@/types';

const initialState: AppState = {
  documents: [],
  user: null,
  ui: {
    isLoading: true,
    isSaving: false,
    announcements: [],
    alerts: [],
  },
  admin: null,
};

export const loadAsync = createAsyncThunk('app/loadAsync', async (_, thunkAPI) => {
  Promise.allSettled([
    thunkAPI.dispatch(loadDocumentsAsync()),
    thunkAPI.dispatch(loadUserAsync()),
  ]);
});
export const loadUserAsync = createAsyncThunk('app/loadUserAsync', async (_, thunkAPI) => {
  try {
    const response = await getAuthenticatedUser()
    if (!response) throw new Error("Failed to load user data");
    return response
  } catch (error: any) {
    const message = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const loadDocumentsAsync = createAsyncThunk('app/loadDocumentsAsync', async (_, thunkAPI) => {
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
  }
});

export const logoutAsync = createAsyncThunk('app/logoutAsync', async (_, thunkAPI) => {
  try {
    const response = await logout();
    return response;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const getDocumentAsync = createAsyncThunk('app/getDocumentAsync', async (id: string, thunkAPI) => {
  try {
    const response = await getDocument(id);
    return response;
  } catch (error: any) {
    const message: string = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const createDocumentAsync = createAsyncThunk('app/createDocumentAsync', async (document: EditorDocument, thunkAPI) => {
  try {
    await createDocument(document);
    const { data, ...userDocument } = document;
    thunkAPI.fulfillWithValue(userDocument);
    return userDocument;
  } catch (error: any) {
    const message: string = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateDocumentAsync = createAsyncThunk('app/updateDocumentAsync', async (payloadCreator: { id: string, partial: Partial<EditorDocument> }, thunkAPI) => {
  const { id, partial } = payloadCreator;
  try {
    await updateDocument(id, partial);
    thunkAPI.fulfillWithValue(payloadCreator);
    return payloadCreator;
  } catch (error: any) {
    const message: string = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const deleteDocumentAsync = createAsyncThunk('app/deleteDocumentAsync', async (id: string, thunkAPI) => {
  try {
    await deleteDocument(id);
    return id;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const loadAdminAsync = createAsyncThunk('app/loadAdminAsync', async (_, thunkAPI) => {
  try {
    const [users, documents] = await Promise.all([getAllUsers(), getAllDocuments()]);
    if (!users || !documents) throw new Error("Failed to load admin data");
    const response = { users, documents: documents.map(document => ({ ...document, author: users.find(user => user.id === document.authorId) || { name: "Unknown" } as User })) };
    return response
  } catch (error: any) {
    const message = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
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
        }).catch((e) => console.error(e));
      }
    },
    saveDocument: (state, action: PayloadAction<EditorDocument>) => {
      const document = action.payload;
      documentDB.update(document);
      const oldUserDocument = state.documents.find(d => d.id === document.id);
      const { data, ...newUserDocument } = document;
      if (oldUserDocument) Object.assign(oldUserDocument, newUserDocument);
    },
    updateDocument: (state, action: PayloadAction<{ id: string, partial: Partial<EditorDocument> }>) => {
      const { id, partial } = action.payload;
      documentDB.patch(id, partial);
      const document = state.documents.find(d => d.id === id);
      if (document) Object.assign(document, partial);
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAsync.fulfilled, (state, action) => {
        state.ui = { ...initialState.ui, isLoading: false }
      })
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
      .addCase(createDocumentAsync.fulfilled, (state, action) => {
        if (state.user && action.payload) {
          state.user.documents.unshift(action.payload);
        }
      })
      .addCase(createDocumentAsync.rejected, (state, action) => {
        const message = action.payload as string;
        state.ui.announcements.push({ message });
      })
      .addCase(updateDocumentAsync.fulfilled, (state, action) => {
        if (state.user && action.payload) {
          const { id, partial } = action.payload;
          const oldUserDocument = state.user?.documents.find(d => d.id === id);
          const { data, ...newUserDocument } = partial;
          if (oldUserDocument) Object.assign(oldUserDocument, newUserDocument);
        }
      })
      .addCase(updateDocumentAsync.rejected, (state, action) => {
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