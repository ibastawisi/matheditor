import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import NProgress from "nprogress";
import documentDB from '@/indexeddb';
import { AppState, Announcement, Alert, EditorDocument, UserDocument } from '../types';
import { createDocumentAction, deleteDocumentAction, getAdminAction, getDocumentAction, getDocumentsAction, updateDocumentAction } from '@/actions';

const initialState: AppState = {
  documents: [],
  announcements: [],
  alerts: [],
  initialized: false,
};

export const load = createAsyncThunk('app/load', async (_, thunkAPI) => {
  Promise.allSettled([
    await thunkAPI.dispatch(loadLocalDocuments()),
    await thunkAPI.dispatch(loadCloudDocuments()),
  ]);
});

export const loadAdmin = createAsyncThunk('app/loadAdmin', async (_, thunkAPI) => {
  NProgress.start();
  try {
    const { data, error } = await getAdminAction();
    if (error) return thunkAPI.rejectWithValue(error);
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  } finally {
    NProgress.done();
  }
});

export const loadLocalDocuments = createAsyncThunk('app/loadLocalDocuments', async (_, thunkAPI) => {
  try {
    const documents = await documentDB.getAll();
    const userDocuments: UserDocument[] = documents.map(document => {
      const { data, ...userDocument } = document;
      return { ...userDocument, variant: 'local' };
    });
    return thunkAPI.fulfillWithValue(userDocuments);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const loadCloudDocuments = createAsyncThunk('app/loadCloudDocuments', async (_, thunkAPI) => {
  NProgress.start();
  try {
    const { data, error } = await getDocumentsAction();
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.fulfillWithValue([] as UserDocument[]);
    const userDocuments: UserDocument[] = data.map(document => ({ ...document, variant: 'cloud' }));
    return thunkAPI.fulfillWithValue(userDocuments);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  } finally {
    NProgress.done();
  }
});

export const getLocalDocument = createAsyncThunk('app/getLocalDocument', async (id: string, thunkAPI) => {
  try {
    const document = await documentDB.getByID(id);
    if (!document) return thunkAPI.rejectWithValue('document not found');
    return thunkAPI.fulfillWithValue(document);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const getCloudDocument = createAsyncThunk('app/getCloudDocument', async (id: string, thunkAPI) => {
  try {
    NProgress.start();
    const { data, error } = await getDocumentAction(id);
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue('document not found');
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  } finally {
    NProgress.done();
  }
});

export const createLocalDocument = createAsyncThunk('app/createLocalDocument', async (document: EditorDocument, thunkAPI) => {
  try {
    const id = await documentDB.add(document);
    if (!id) return thunkAPI.rejectWithValue('failed to create document');
    const { data, ...userDocument } = document;
    const payload: UserDocument = { ...userDocument, variant: 'local' };
    return thunkAPI.fulfillWithValue(payload);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const createCloudDocument = createAsyncThunk('app/createCloudDocument', async (document: EditorDocument, thunkAPI) => {
  NProgress.start();
  try {
    const { data, error } = await createDocumentAction(document);
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue('failed to create document');
    const payload: UserDocument = { ...data, variant: 'cloud' };
    return thunkAPI.fulfillWithValue(payload);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  } finally {
    NProgress.done();
  }
});

export const updateLocalDocument = createAsyncThunk('app/updateLocalDocument', async (payloadCreator: { id: string, partial: Partial<EditorDocument> }, thunkAPI) => {
  try {
  const { id, partial } = payloadCreator;
    documentDB.patch(id, partial);
    const { data, ...userDocument } = await documentDB.getByID(id);
    const payload: UserDocument = { ...userDocument, variant: 'local' };
    return thunkAPI.fulfillWithValue(payload);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const updateCloudDocument = createAsyncThunk('app/updateCloudDocument', async (payloadCreator: { id: string, partial: Partial<EditorDocument> }, thunkAPI) => {
  NProgress.start();
  const { id, partial } = payloadCreator;
  try {
    const { data, error } = await updateDocumentAction(id, partial);
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue('failed to update document');
    const payload: UserDocument = { ...data, variant: 'cloud' };
    return thunkAPI.fulfillWithValue(payload);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  } finally {
    NProgress.done();
  }
});

export const deleteLocalDocument = createAsyncThunk('app/deleteLocalDocument', async (id: string, thunkAPI) => {
  try {
    await documentDB.deleteByID(id);
    return thunkAPI.fulfillWithValue(id);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const deleteCloudDocument = createAsyncThunk('app/deleteCloudDocument', async (id: string, thunkAPI) => {
  try {
    NProgress.start();
    const { data, error } = await deleteDocumentAction(id);
    if (error) return thunkAPI.rejectWithValue(error);
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  } finally {
    NProgress.done();
  }
});

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AppState["user"]>) {
      state.user = action.payload;
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
      .addCase(load.fulfilled, (state, action) => {
        state.initialized = true;
      })
      .addCase(loadAdmin.fulfilled, (state, action) => {
        state.admin = action.payload;
      })
      .addCase(loadLocalDocuments.fulfilled, (state, action) => {
        const documents = action.payload;
        if (documents) state.documents.push(...documents);
      })
      .addCase(loadCloudDocuments.fulfilled, (state, action) => {
        const documents = action.payload;
        if (documents) state.documents.push(...documents);
      })
      .addCase(getCloudDocument.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(createLocalDocument.fulfilled, (state, action) => {
        const document = action.payload;
        state.documents.unshift(document);
      })
      .addCase(createLocalDocument.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(createCloudDocument.fulfilled, (state, action) => {
        const document = action.payload;
        state.documents.unshift(document);
      })
      .addCase(createCloudDocument.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(updateLocalDocument.fulfilled, (state, action) => {
        const document = action.payload;
        state.documents = state.documents.map(doc => doc.variant === "local" && doc.id === document.id ? document : doc);
      })
      .addCase(updateLocalDocument.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(updateCloudDocument.fulfilled, (state, action) => {
        const document = action.payload;
        state.documents = state.documents.map(doc => doc.variant === "cloud" && doc.id === document.id ? document : doc);
      })
      .addCase(updateCloudDocument.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(deleteLocalDocument.fulfilled, (state, action) => {
        const id = action.payload;
        const index = state.documents.findIndex(doc => doc.variant === "local" && doc.id === id);
        if (index !== -1) state.documents.splice(index, 1);
      })
      .addCase(deleteLocalDocument.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(deleteCloudDocument.fulfilled, (state, action) => {
        const id = action.payload;
        const index = state.documents.findIndex(doc => doc.variant === "cloud" && doc.id === id);
        if (index !== -1) state.documents.splice(index, 1);
      })
      .addCase(deleteCloudDocument.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
  }
});

export default appSlice.reducer;