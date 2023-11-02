import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import NProgress from "nprogress";
import documentDB, { revisionDB } from '@/indexeddb';
import { AppState, Announcement, Alert, EditorDocument, LocalDocument, User, PatchUserResponse, GetSessionResponse, DeleteRevisionResponse, GetRevisionResponse, ForkDocumentResponse, DocumentUpdateInput, EditorDocumentRevision, PostRevisionResponse } from '../types';
import { GetDocumentsResponse, PostDocumentsResponse, DeleteDocumentResponse, GetDocumentResponse, PatchDocumentResponse } from '@/types';
import { validate } from 'uuid';

const initialState: AppState = {
  documents: [],
  revisions: [],
  announcements: [],
  alerts: [],
  initialized: false,
  drawer: false,
};

export const load = createAsyncThunk('app/load', async (_, thunkAPI) => {
  await Promise.allSettled([
    thunkAPI.dispatch(loadSession()),
    thunkAPI.dispatch(loadLocalDocuments()),
    thunkAPI.dispatch(loadLocalRevisions()),
    thunkAPI.dispatch(loadCloudDocuments()),
  ]);
});

export const loadSession = createAsyncThunk('app/loadSession', async (_, thunkAPI) => {
  try {
    const response = await fetch('/api/auth/session');
    const data = await response.json() as GetSessionResponse;
    if (!data) return thunkAPI.rejectWithValue('unauthenticated');
    const user = {
      id: data.user.id,
      handle: data.user.handle,
      name: data.user.name,
      email: data.user.email,
      image: data.user.image
    }
    return thunkAPI.fulfillWithValue(user);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const loadLocalDocuments = createAsyncThunk('app/loadLocalDocuments', async (_, thunkAPI) => {
  try {
    const documents = await documentDB.getAll();
    const localDocuments: LocalDocument[] = documents.map(document => {
      const { data, ...localDocument } = document;
      return localDocument;
    });
    return thunkAPI.fulfillWithValue(localDocuments);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const loadLocalRevisions = createAsyncThunk('app/loadLocalRevisions', async (_, thunkAPI) => {
  try {
    const revisions = await revisionDB.getAll();
    const localRevisions = revisions.map(revision => {
      const { data, ...localRevision } = revision;
      return localRevision;
    });
    return thunkAPI.fulfillWithValue(localRevisions);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const loadCloudDocuments = createAsyncThunk('app/loadCloudDocuments', async (_, thunkAPI) => {
  try {
    NProgress.start();
    const response = await fetch('/api/documents');
    const { data, error } = await response.json() as GetDocumentsResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.fulfillWithValue([]);
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  } finally {
    NProgress.done();
  }
});

export const getLocalDocument = createAsyncThunk('app/getLocalDocument', async (id: string, thunkAPI) => {
  try {
    const isValidId = validate(id);
    const document = isValidId ? await documentDB.getByID(id) : await documentDB.getOneByKey("handle", id);
    if (!document) return thunkAPI.rejectWithValue('document not found');
    return thunkAPI.fulfillWithValue(document);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const getLocalRevision = createAsyncThunk('app/getLocalRevision', async (id: string, thunkAPI) => {
  try {
    const revision = await revisionDB.getByID(id);
    if (!revision) return thunkAPI.rejectWithValue('revision not found');
    return thunkAPI.fulfillWithValue(revision);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const getCloudDocument = createAsyncThunk('app/getCloudDocument', async (id: string, thunkAPI) => {
  try {
    NProgress.start();
    const response = await fetch(`/api/documents/${id}`);
    const { data, error } = await response.json() as GetDocumentResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue('document not found');
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  } finally {
    NProgress.done();
  }
});

export const getCloudRevision = createAsyncThunk('app/getCloudRevision', async (id: string, thunkAPI) => {
  try {
    NProgress.start();
    const response = await fetch(`/api/revisions/${id}`);
    const { data, error } = await response.json() as GetRevisionResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue('revision not found');
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  } finally {
    NProgress.done();
  }
});


export const forkCloudDocument = createAsyncThunk('app/forkCloudDocument', async (id: string, thunkAPI) => {
  try {
    NProgress.start();
    const response = await fetch(`/api/documents/new/${id}`);
    const { data, error } = await response.json() as ForkDocumentResponse;
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
    const { data, ...localDocument } = document;
    return thunkAPI.fulfillWithValue(localDocument as LocalDocument);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const createLocalRevision = createAsyncThunk('app/createLocalRevision', async (revision: EditorDocumentRevision, thunkAPI) => {
  try {
    const id = await revisionDB.add(revision);
    if (!id) return thunkAPI.rejectWithValue('failed to create revision');
    const { data, ...localRevision } = revision;
    return thunkAPI.fulfillWithValue(localRevision);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const createCloudDocument = createAsyncThunk('app/createCloudDocument', async (document: EditorDocument, thunkAPI) => {
  try {
    NProgress.start();
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(document),
    });
    const { data, error } = await response.json() as PostDocumentsResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue('failed to create document');
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  } finally {
    NProgress.done();
  }
});

export const createCloudRevision = createAsyncThunk('app/createCloudRevision', async (revision: EditorDocumentRevision, thunkAPI) => {
  try {
    NProgress.start();
    const response = await fetch('/api/revisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(revision),
    });
    const { data, error } = await response.json() as PostRevisionResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue('failed to create revision');
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  } finally {
    NProgress.done();
  }
});

export const updateLocalDocument = createAsyncThunk('app/updateLocalDocument', async (payloadCreator: { id: string, partial: DocumentUpdateInput }, thunkAPI) => {
  try {
    const { id, partial } = payloadCreator;
    const result = await documentDB.patch(id, partial);
    if (!result) return thunkAPI.rejectWithValue('failed to update document')
    const { data, ...localDocument } = await documentDB.getByID(id);
    return thunkAPI.fulfillWithValue(localDocument as LocalDocument);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const updateCloudDocument = createAsyncThunk('app/updateCloudDocument', async (payloadCreator: { id: string, partial: DocumentUpdateInput }, thunkAPI) => {
  try {
    NProgress.start();
    const { id, partial } = payloadCreator;
    const response = await fetch(`/api/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    const { data, error } = await response.json() as PatchDocumentResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue('failed to update document');
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  } finally {
    NProgress.done();
  }
});

export const deleteLocalDocument = createAsyncThunk('app/deleteLocalDocument', async (id: string, thunkAPI) => {
  try {
    await documentDB.deleteByID(id);
    await revisionDB.deleteManyByKey("documentId", id);
    return thunkAPI.fulfillWithValue(id);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const deleteLocalRevision = createAsyncThunk('app/deleteLocalRevision', async (id: string, thunkAPI) => {
  try {
    await revisionDB.deleteByID(id);
    return thunkAPI.fulfillWithValue(id);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const deleteCloudDocument = createAsyncThunk('app/deleteCloudDocument', async (id: string, thunkAPI) => {
  try {
    NProgress.start();
    const response = await fetch(`/api/documents/${id}`, { method: 'DELETE', });
    const { data, error } = await response.json() as DeleteDocumentResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue('failed to delete document');
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  } finally {
    NProgress.done();
  }
});

export const deleteCloudRevision = createAsyncThunk('app/deleteCloudRevision', async (id: string, thunkAPI) => {
  try {
    NProgress.start();
    const response = await fetch(`/api/revisions/${id}`, { method: 'DELETE', });
    const { data, error } = await response.json() as DeleteRevisionResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue('failed to delete revision');
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  } finally {
    NProgress.done();
  }
});

export const updateUser = createAsyncThunk('app/updateUser', async (payloadCreator: { id: string, partial: Partial<User> }, thunkAPI) => {
  try {
    NProgress.start();
    const { id, partial } = payloadCreator;
    const response = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    const { data, error } = await response.json() as PatchUserResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue('failed to update user');
    const payload: User = data;
    return thunkAPI.fulfillWithValue(payload);
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
    toggleDrawer: (state) => {
      state.drawer = !state.drawer;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(load.fulfilled, (state, action) => {
        state.documents = state.documents.sort((a, b) => {
          const first = a.local?.updatedAt || a.cloud?.updatedAt;
          const second = b.local?.updatedAt || b.cloud?.updatedAt;
          if (!first && !second) return 0;
          if (!first) return 1;
          if (!second) return -1;
          return new Date(second).getTime() - new Date(first).getTime();
        });
        state.initialized = true;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        const user = action.payload;
        state.user = user;
      })
      .addCase(loadLocalDocuments.fulfilled, (state, action) => {
        const documents = action.payload;
        documents.forEach(document => {
          const userDocument = state.documents.find(doc => doc.id === document.id);
          if (!userDocument) state.documents.push({ id: document.id, local: document });
          else userDocument.local = document;
        });
      })
      .addCase(loadLocalRevisions.fulfilled, (state, action) => {
        const revisions = action.payload;
        state.revisions = revisions;
      })
      .addCase(loadCloudDocuments.fulfilled, (state, action) => {
        const documents = action.payload;
        documents.forEach(document => {
          const userDocument = state.documents.find(doc => doc.id === document.id);
          if (!userDocument) state.documents.push({ id: document.id, cloud: document });
          else userDocument.cloud = document;
        });
      })
      .addCase(getCloudDocument.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(getCloudRevision.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(forkCloudDocument.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(createLocalDocument.fulfilled, (state, action) => {
        const document = action.payload;
        const userDocument = state.documents.find(doc => doc.id === document.id);
        if (!userDocument) state.documents.unshift({ id: document.id, local: document });
        else userDocument.local = document;
      })
      .addCase(createLocalRevision.fulfilled, (state, action) => {
        const revision = action.payload;
        state.revisions.unshift(revision);
      })
      .addCase(createCloudDocument.fulfilled, (state, action) => {
        const document = action.payload;
        const userDocument = state.documents.find(doc => doc.id === document.id);
        if (!userDocument) state.documents.unshift({ id: document.id, cloud: document });
        else userDocument.cloud = document;
      })
      .addCase(createCloudDocument.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(createCloudRevision.fulfilled, (state, action) => {
        const revision = action.payload;
        const document = state.documents.find(doc => doc.id === revision.documentId);
        if (!document?.cloud) return;
        document.cloud.revisions.unshift(revision);
      })
      .addCase(createCloudRevision.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(updateLocalDocument.fulfilled, (state, action) => {
        const document = action.payload;
        const userDocument = state.documents.find(doc => doc.id === document.id);
        if (!userDocument) state.documents.unshift({ id: document.id, local: document });
        else userDocument.local = document;
      })
      .addCase(updateCloudDocument.fulfilled, (state, action) => {
        const document = action.payload;
        const userDocument = state.documents.find(doc => doc.id === document.id);
        if (!userDocument) state.documents.unshift({ id: document.id, cloud: document });
        else userDocument.cloud = document;
      })
      .addCase(updateCloudDocument.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(deleteLocalDocument.fulfilled, (state, action) => {
        const id = action.payload;
        const userDocument = state.documents.find(doc => doc.id === id);
        if (!userDocument) return;
        if (!userDocument.cloud) state.documents.splice(state.documents.indexOf(userDocument), 1);
        else delete userDocument.local;
      })
      .addCase(deleteLocalRevision.fulfilled, (state, action) => {
        const id = action.payload;
        const revision = state.revisions.find(revision => revision.id === id);
        if (!revision) return;
        state.revisions.splice(state.revisions.indexOf(revision), 1);
      })
      .addCase(deleteCloudDocument.fulfilled, (state, action) => {
        const id = action.payload;
        const userDocument = state.documents.find(doc => doc.id === id);
        if (!userDocument) return;
        const index = state.documents.indexOf(userDocument);
        if (!userDocument.local) state.documents.splice(index, 1);
        else delete userDocument.cloud;
      })
      .addCase(deleteCloudDocument.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(deleteCloudRevision.fulfilled, (state, action) => {
        const { id, documentId } = action.payload;
        const document = state.documents.find(doc => doc.id === documentId);
        if (!document?.cloud) return;
        document.cloud.revisions = document.cloud.revisions.filter(revision => revision.id !== id);
      })
      .addCase(deleteCloudRevision.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const user = action.payload;
        state.user = user;
      })
      .addCase(updateUser.rejected, (state, action) => {
        const message = action.payload as string;
        state.announcements.push({ message });
      })
  }
});

export default appSlice.reducer;