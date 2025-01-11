import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import NProgress from "nprogress";
import documentDB, { revisionDB } from '@/indexeddb';
import {
  AppState,
  Announcement,
  Alert,
  LocalDocument,
  User,
  PatchUserResponse,
  GetSessionResponse,
  DeleteRevisionResponse,
  GetRevisionResponse,
  ForkDocumentResponse,
  DocumentUpdateInput,
  EditorDocumentRevision,
  PostRevisionResponse,
  DocumentCreateInput,
  BackupDocument,
  LocalDocumentRevision,
  CloudDocument
} from '../types';
import { GetDocumentsResponse, PostDocumentsResponse, DeleteDocumentResponse, GetDocumentResponse, PatchDocumentResponse } from '@/types';
import { validate } from 'uuid';
import { generateHtml } from '@/editor';

const initialState: AppState = {
  documents: [],
  ui: {
    announcements: [],
    alerts: [],
    initialized: false,
    drawer: false,
    page: 1,
    filter: 0,
    sort: {
      key: "updatedAt",
      direction: "desc"
    },
    diff: {
      open: false,
    }
  }
};

export const load = createAsyncThunk('app/load', async (_, thunkAPI) => {
  await Promise.allSettled([
    thunkAPI.dispatch(loadSession()),
    thunkAPI.dispatch(loadLocalDocuments()),
    thunkAPI.dispatch(loadCloudDocuments()),
  ]);
});

export const loadSession = createAsyncThunk('app/loadSession', async (_, thunkAPI) => {
  try {
    const response = await fetch('/api/auth/session');
    const data = await response.json() as GetSessionResponse;
    if (!data) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "session not found" });
    if (!data.user) return thunkAPI.fulfillWithValue(undefined);
    const user = {
      id: data.user.id,
      handle: data.user.handle,
      name: data.user.name,
      email: data.user.email,
      image: data.user.image
    }
    return thunkAPI.fulfillWithValue(user);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  }
});

export const loadLocalDocuments = createAsyncThunk('app/loadLocalDocuments', async (_, thunkAPI) => {
  try {
    const documents = await documentDB.getAll();
    const revisions = await revisionDB.getAll();
    const localDocuments: LocalDocument[] = await Promise.all(documents.map(async (document) => {
      const { data, ...rest } = document;
      const backupDocument: BackupDocument = { ...document, revisions: revisions.filter(revision => revision.documentId === document.id) };
      const backupDocumentSize = new Blob([JSON.stringify(backupDocument)]).size;
      const localRevisions = backupDocument.revisions.map(revision => {
        const { data, ...rest } = revision;
        const revisionSize = new Blob([JSON.stringify(revision)]).size;
        const localRevision: LocalDocumentRevision = { ...rest, size: revisionSize };
        return localRevision;
      });
      const thumbnail = await generateHtml({ ...data, root: { ...data.root, children: data.root.children.slice(0, 5) } });
      const localDocument: LocalDocument = {
        ...rest,
        revisions: localRevisions,
        size: backupDocumentSize,
        thumbnail
      };
      return localDocument;
    }));
    return thunkAPI.fulfillWithValue(localDocuments);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  }
});

export const loadCloudDocuments = createAsyncThunk('app/loadCloudDocuments', async (payloadCreator: CloudDocument[] | undefined, thunkAPI) => {
  try {
    NProgress.start();
    if (payloadCreator) return thunkAPI.fulfillWithValue(payloadCreator);
    const response = await fetch('/api/documents');
    const { data, error } = await response.json() as GetDocumentsResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.fulfillWithValue([]);
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  } finally {
    NProgress.done();
  }
});

export const getLocalDocument = createAsyncThunk('app/getLocalDocument', async (id: string, thunkAPI) => {
  try {
    const isValidId = validate(id);
    const document = isValidId ? await documentDB.getByID(id) : await documentDB.getOneByKey("handle", id);
    if (!document) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "document not found" });
    return thunkAPI.fulfillWithValue(document);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  }
});

export const getLocalRevision = createAsyncThunk('app/getLocalRevision', async (id: string, thunkAPI) => {
  try {
    const revision = await revisionDB.getByID(id);
    if (!revision) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "revision not found" });
    return thunkAPI.fulfillWithValue(revision);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  }
});

export const getLocalDocumentRevisions = createAsyncThunk('app/getLocalDocumentRevisions', async (id: string, thunkAPI) => {
  try {
    const revisions = await revisionDB.getManyByKey("documentId", id);
    return thunkAPI.fulfillWithValue(revisions);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  }
});

export const getCloudDocument = createAsyncThunk('app/getCloudDocument', async (id: string, thunkAPI) => {
  try {
    NProgress.start();
    const response = await fetch(`/api/documents/${id}`);
    const { data, error } = await response.json() as GetDocumentResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "document not found" });
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
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
    if (!data) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "revision not found" });
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  } finally {
    NProgress.done();
  }
});


export const forkLocalDocument = createAsyncThunk('app/forkLocalDocument', async (payloadCreator: { id: string, revisionId?: string | null }, thunkAPI) => {
  try {
    const { id, revisionId } = payloadCreator;
    const isValidId = validate(id);
    const document = isValidId ? await documentDB.getByID(id) : await documentDB.getOneByKey("handle", id);
    if (!document) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "document not found" });
    if (revisionId) {
      const revision = await revisionDB.getByID(revisionId);
      if (!revision) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "revision not found" });
      document.head = revision.id;
      document.updatedAt = revision.createdAt;
      document.data = revision.data;
    }
    return thunkAPI.fulfillWithValue(document);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  }
});

export const forkCloudDocument = createAsyncThunk('app/forkCloudDocument', async (payloadCreator: { id: string, revisionId?: string | null }, thunkAPI) => {
  try {
    const { id, revisionId } = payloadCreator;
    NProgress.start();
    const response = await fetch(`/api/documents/new/${id}${revisionId ? `?v=${revisionId}` : ''}`);
    const { data, error } = await response.json() as ForkDocumentResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "document not found" });
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  } finally {
    NProgress.done();
  }
});

export const createLocalDocument = createAsyncThunk('app/createLocalDocument', async (payloadCreator: DocumentCreateInput, thunkAPI) => {
  try {
    const { coauthors, published, collab, private: isPrivate, revisions, ...document } = payloadCreator;
    const id = await documentDB.add(document);
    if (!id) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "failed to create document" });
    const { data, ...rest } = document;
    if (revisions) await revisionDB.addMany(revisions)
    const localDocumentRevisions = (revisions ?? []).map(revision => {
      const { data, ...rest } = revision;
      const revisionSize = new Blob([JSON.stringify(revision)]).size;
      const localRevision: LocalDocumentRevision = { ...rest, size: revisionSize };
      return localRevision;
    });
    const backupDocument: BackupDocument = { ...document, revisions: revisions ?? [] };
    const backupDocumentSize = new Blob([JSON.stringify(backupDocument)]).size;
    const thumbnail = await generateHtml({ ...data, root: { ...data.root, children: data.root.children.slice(0, 5) } });
    const localDocument: LocalDocument = { ...rest, revisions: localDocumentRevisions, size: backupDocumentSize, thumbnail };
    return thunkAPI.fulfillWithValue(localDocument);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  }
});

export const createLocalRevision = createAsyncThunk('app/createLocalRevision', async (revision: EditorDocumentRevision, thunkAPI) => {
  try {
    const id = await revisionDB.add(revision);
    if (!id) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "failed to create revision" });
    const { data, ...rest } = revision;
    const revisionSize = new Blob([JSON.stringify(revision)]).size;
    const localRevision: LocalDocumentRevision = { ...rest, size: revisionSize };
    return thunkAPI.fulfillWithValue(localRevision);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  }
});

export const createCloudDocument = createAsyncThunk('app/createCloudDocument', async (payloadCreator: DocumentCreateInput, thunkAPI) => {
  try {
    NProgress.start();
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadCreator),
    });
    const { data, error } = await response.json() as PostDocumentsResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "failed to create document" });
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
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
    if (!data) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "failed to create revision" });
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  } finally {
    NProgress.done();
  }
});

export const updateLocalDocument = createAsyncThunk('app/updateLocalDocument', async (payloadCreator: { id: string, partial: DocumentUpdateInput }, thunkAPI) => {
  try {
    const { id, partial } = payloadCreator;
    const { coauthors, published, collab, private: isPrivate, revisions, ...document } = partial;
    const result = await documentDB.patch(id, document);
    if (!result) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "failed to update document" });
    const payload: { id: string, partial: Partial<LocalDocument> } = { id, partial: { ...document } };
    if (revisions) {
      await revisionDB.addMany(revisions);
      const localDocumentRevisions = (revisions ?? []).map(revision => {
        const { data, ...rest } = revision;
        const revisionSize = new Blob([JSON.stringify(revision)]).size;
        const localRevision: LocalDocumentRevision = { ...rest, size: revisionSize };
        return localRevision;
      });
      payload.partial.revisions = localDocumentRevisions;
    }
    const editorDocument = await documentDB.getByID(id);
    const editorDocumentRevisions = await revisionDB.getManyByKey("documentId", id);
    const backupDocument: BackupDocument = { ...editorDocument, revisions: editorDocumentRevisions };
    const backupDocumentSize = new Blob([JSON.stringify(backupDocument)]).size;
    payload.partial.size = backupDocumentSize;

    return thunkAPI.fulfillWithValue(payload);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
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
    if (!data) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "failed to update document" });
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
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
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  }
});

export const deleteLocalRevision = createAsyncThunk('app/deleteLocalRevision', async (payloadCreator: { id: string, documentId: string }, thunkAPI) => {
  try {
    await revisionDB.deleteByID(payloadCreator.id);
    return thunkAPI.fulfillWithValue(payloadCreator);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  }
});

export const deleteCloudDocument = createAsyncThunk('app/deleteCloudDocument', async (id: string, thunkAPI) => {
  try {
    NProgress.start();
    const response = await fetch(`/api/documents/${id}`, { method: 'DELETE', });
    const { data, error } = await response.json() as DeleteDocumentResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "failed to delete document" });
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  } finally {
    NProgress.done();
  }
});

export const deleteCloudRevision = createAsyncThunk('app/deleteCloudRevision', async (payloadCreator: { id: string, documentId: string }, thunkAPI) => {
  try {
    NProgress.start();
    const response = await fetch(`/api/revisions/${payloadCreator.id}`, { method: 'DELETE', });
    const { data, error } = await response.json() as DeleteRevisionResponse;
    if (error) return thunkAPI.rejectWithValue(error);
    if (!data) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "failed to delete revision" });
    return thunkAPI.fulfillWithValue(data);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
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
    if (!data) return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: "failed to update user" });
    const payload: User = data;
    return thunkAPI.fulfillWithValue(payload);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
  } finally {
    NProgress.done();
  }
});

export const alert = createAsyncThunk('app/alert', async (payloadCreator: Alert, thunkAPI) => {
  try {
    const id = await new Promise((resolve) => {
      const handler = (event: MouseEvent): any => {
        const target = event.target as HTMLElement;
        const button = target.closest("button");
        const paper = target.closest(".MuiDialog-paper");
        if (paper && !button) return document.addEventListener("click", handler, { once: true });
        resolve(button?.id ?? null);
      };
      setTimeout(() => { document.addEventListener("click", handler, { once: true }); }, 0);
    });
    return thunkAPI.fulfillWithValue(id);
  } catch (error: any) {
    console.error(error);
    return thunkAPI.rejectWithValue({ title: "Something went wrong", subtitle: error.message });
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
      state.ui.announcements.push(action.payload);
    },
    clearAnnouncement: (state) => {
      state.ui.announcements.shift();
    },
    clearAlert: (state) => {
      state.ui.alerts.shift();
    },
    toggleDrawer: (state, action: PayloadAction<boolean | undefined>) => {
      if (action.payload !== undefined) state.ui.drawer = action.payload;
      else state.ui.drawer = !state.ui.drawer;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.ui.page = action.payload;
    },
    setFilter: (state, action: PayloadAction<number>) => {
      state.ui.filter = action.payload;
    },
    setSort: (state, action: PayloadAction<Partial<{ key: string, direction: "asc" | "desc" }>>) => {
      state.ui.sort = { ...state.ui.sort, ...action.payload };
    },
    setDiff: (state, action: PayloadAction<Partial<AppState["ui"]["diff"]>>) => {
      state.ui.diff = { ...state.ui.diff, ...action.payload };
    }
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
        state.ui.initialized = true;
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
      .addCase(loadCloudDocuments.fulfilled, (state, action) => {
        const documents = action.payload;
        documents.forEach(document => {
          const userDocument = state.documents.find(doc => doc.id === document.id);
          if (!userDocument) state.documents.push({ id: document.id, cloud: document });
          else userDocument.cloud = document;
        });
      })
      .addCase(getCloudDocument.fulfilled, (state, action) => {
        const { cloudDocument } = action.payload;
        const userDocument = state.documents.find(doc => doc.id === cloudDocument.id);
        if (!userDocument) state.documents.unshift({ id: cloudDocument.id, cloud: cloudDocument });
        else userDocument.cloud = cloudDocument;
      })
      .addCase(getCloudRevision.rejected, (state, action) => {
        const message = action.payload as { title: string, subtitle: string };
        state.ui.announcements.push({ message });
      })
      .addCase(forkCloudDocument.rejected, (state, action) => {
        const message = action.payload as { title: string, subtitle: string };
        state.ui.announcements.push({ message });
      })
      .addCase(createLocalDocument.fulfilled, (state, action) => {
        const document = action.payload;
        const userDocument = state.documents.find(doc => doc.id === document.id);
        if (!userDocument) state.documents.unshift({ id: document.id, local: document });
        else userDocument.local = document;
      })
      .addCase(createLocalRevision.fulfilled, (state, action) => {
        const revision = action.payload;
        const userDocument = state.documents.find(doc => doc.id === revision.documentId);
        if (!userDocument) return;
        const localDocument = userDocument.local;
        if (!localDocument) return;
        localDocument.revisions.unshift(revision);
        localDocument.size += revision.size;
      })
      .addCase(createCloudDocument.fulfilled, (state, action) => {
        const document = action.payload;
        const userDocument = state.documents.find(doc => doc.id === document.id);
        if (!userDocument) state.documents.unshift({ id: document.id, cloud: document });
        else userDocument.cloud = document;
      })
      .addCase(createCloudDocument.rejected, (state, action) => {
        const message = action.payload as { title: string, subtitle: string };
        state.ui.announcements.push({ message });
      })
      .addCase(createCloudRevision.fulfilled, (state, action) => {
        const revision = action.payload;
        const document = state.documents.find(doc => doc.id === revision.documentId);
        if (!document?.cloud) return;
        document.cloud.revisions.unshift(revision);
      })
      .addCase(createCloudRevision.rejected, (state, action) => {
        const message = action.payload as { title: string, subtitle: string };
        state.ui.announcements.push({ message });
      })
      .addCase(updateLocalDocument.fulfilled, (state, action) => {
        const { id, partial } = action.payload;
        const userDocument = state.documents.find(doc => doc.id === id);
        if (!userDocument) return;
        const localDocument = userDocument.local;
        if (!localDocument) return;
        Object.assign(localDocument, partial);
      })
      .addCase(updateCloudDocument.fulfilled, (state, action) => {
        const document = action.payload;
        const userDocument = state.documents.find(doc => doc.id === document.id);
        if (!userDocument) state.documents.unshift({ id: document.id, cloud: document });
        else userDocument.cloud = document;
      })
      .addCase(updateCloudDocument.rejected, (state, action) => {
        const message = action.payload as { title: string, subtitle: string };
        state.ui.announcements.push({ message });
      })
      .addCase(deleteLocalDocument.fulfilled, (state, action) => {
        const id = action.payload;
        const userDocument = state.documents.find(doc => doc.id === id);
        if (!userDocument) return;
        if (!userDocument.cloud) state.documents.splice(state.documents.indexOf(userDocument), 1);
        else delete userDocument.local;
      })
      .addCase(deleteLocalRevision.fulfilled, (state, action) => {
        const { id, documentId } = action.payload;
        const userDocument = state.documents.find(doc => doc.id === documentId);
        if (!userDocument) return;
        const localDocument = userDocument.local;
        if (!localDocument) return;
        const revision = localDocument.revisions.find(revision => revision.id === id);
        if (!revision) return;
        localDocument.size -= revision.size;
        localDocument.revisions = localDocument.revisions.filter(revision => revision.id !== id);
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
        const message = action.payload as { title: string, subtitle: string };
        state.ui.announcements.push({ message });
      })
      .addCase(deleteCloudRevision.fulfilled, (state, action) => {
        const { id, documentId } = action.payload;
        const userDocument = state.documents.find(doc => doc.id === documentId);
        if (!userDocument) return;
        const cloudDocument = userDocument.cloud;
        if (!cloudDocument) return;
        const revision = cloudDocument.revisions.find(revision => revision.id === id);
        if (!revision) return;
        cloudDocument.revisions = cloudDocument.revisions.filter(revision => revision.id !== id);
        if (!cloudDocument.size || !revision.size) return;
        cloudDocument.size -= revision.size;
      })
      .addCase(deleteCloudRevision.rejected, (state, action) => {
        const message = action.payload as { title: string, subtitle: string };
        state.ui.announcements.push({ message });
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const user = action.payload;
        state.user = user;
      })
      .addCase(updateUser.rejected, (state, action) => {
        const message = action.payload as { title: string, subtitle: string };
        state.ui.announcements.push({ message });
      })
      .addCase(alert.pending, (state, action) => {
        const alert = action.meta.arg;
        state.ui.alerts.push(alert);
      })
      .addCase(alert.fulfilled, state => {
        state.ui.alerts.shift();
      })
      .addCase(alert.rejected, (state, action) => {
        state.ui.alerts.shift();
        const message = action.payload as { title: string, subtitle: string };
        state.ui.announcements.push({ message });
      })
  }
});

export default appSlice.reducer;