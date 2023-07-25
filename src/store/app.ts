import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { showLoading, hideLoading } from 'react-redux-loading-bar';
import documentDB from '@/indexeddb';
import { AppState, Announcement, Alert, EditorDocument, UserDocument } from '../types';
import { createDocumentAction, deleteDocumentAction, getDocumentAction, updateDocumentAction } from '@/app/actions';

const initialState: AppState = {
  user: null,
  documents: [],
  announcements: [],
  alerts: [],
  initialized: false,
};

export const loadAsync = createAsyncThunk('app/loadAsync', async (_, thunkAPI) => {
  Promise.allSettled([
    thunkAPI.dispatch(loadDocumentsAsync()),
  ]);
});

export const loadDocumentsAsync = createAsyncThunk('app/loadDocumentsAsync', async (_, thunkAPI) => {
  thunkAPI.dispatch(showLoading())
  try {
    const documents = await documentDB.getAll();
    const userDocuments = documents.map(document => {
      const { data, ...userDocument } = document;
      return userDocument;
    });
    return userDocuments;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  } finally {
    thunkAPI.dispatch(hideLoading())
  }
});
export const getDocumentAsync = createAsyncThunk('app/getDocumentAsync', async (id: string, thunkAPI) => {
  try {
    thunkAPI.dispatch(showLoading());
    const response = await getDocumentAction(id);
    return response;
  } catch (error: any) {
    const message: string = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  } finally {
    thunkAPI.dispatch(hideLoading())
  }
});

export const createDocumentAsync = createAsyncThunk('app/createDocumentAsync', async (document: EditorDocument, thunkAPI) => {
  thunkAPI.dispatch(showLoading());
  try {
    await createDocumentAction(document);
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

export const updateDocumentAsync = createAsyncThunk('app/updateDocumentAsync', async (payloadCreator: { id: string, partial: Partial<EditorDocument> }, thunkAPI) => {
  thunkAPI.dispatch(showLoading());
  const { id, partial } = payloadCreator;
  try {
    await updateDocumentAction(id, partial);
    thunkAPI.fulfillWithValue(payloadCreator);
    return payloadCreator;
  } catch (error: any) {
    const message: string = error.response?.data?.error || error.message;
    return thunkAPI.rejectWithValue(message);
  } finally {
    thunkAPI.dispatch(hideLoading())
  }
});

export const deleteDocumentAsync = createAsyncThunk('app/deleteDocumentAsync', async (id: string, thunkAPI) => {
  try {
    thunkAPI.dispatch(showLoading());
    await deleteDocumentAction(id);
    return id;
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
    setUser(state, action: PayloadAction<AppState["user"]>) {
      state.user = action.payload;
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
    loadCloudDocuments(state, action: PayloadAction<Omit<UserDocument, "variant">[]>) {
      const documents = action.payload.map(document => ({ ...document, variant: "cloud" })) as UserDocument[];
      state.documents.push(...documents);
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
      state.documents.unshift({ ...userDocument });
    },
    deleteDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(d => d.id !== action.payload);
      documentDB.deleteByID(action.payload);
    },
    announce: (state, action: PayloadAction<Announcement>) => {
      state.announcements.push(action.payload);
    },
    clearAnnouncement: (state) => {
      state.announcements.shift();
    },
    alert: (state, action: PayloadAction<Alert>) => {
      state.alerts.push(action.payload);
    },
    clearAlert: (state) => {
      state.alerts.shift();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAsync.fulfilled, (state, action) => {
        state.initialized = true;
      })
      .addCase(loadDocumentsAsync.fulfilled, (state, action) => {
        state.documents = action.payload;
      })
      .addCase(getDocumentAsync.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(createDocumentAsync.fulfilled, (state, action) => {
        if (state.user && action.payload) {
          state.user.documents.unshift(action.payload);
        }
      })
      .addCase(createDocumentAsync.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
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
        state.announcements.push({ message });
      })
      .addCase(deleteDocumentAsync.fulfilled, (state, action) => {
        if (state.user) {
          state.user.documents = state.user.documents.filter(doc => doc.id !== action.payload);
        }
      })
      .addCase(deleteDocumentAsync.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
  }
});

export default appSlice.reducer;