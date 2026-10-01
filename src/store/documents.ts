import type { StateCreator } from 'zustand';
import NProgress from "nprogress";
import { validate } from 'uuid';
import documentDB, { revisionDB } from '@/indexeddb';
import type {
  BackupDocument,
  CloudDocument,
  CloudDocumentRevision,
  DeleteDocumentResponse,
  DeleteRevisionResponse,
  DocumentCreateInput,
  DocumentStorageUsage,
  DocumentUpdateInput,
  EditorDocument,
  EditorDocumentRevision,
  ForkDocumentResponse,
  GetDocumentResponse,
  GetDocumentsResponse,
  GetDocumentStorageUsageResponse,
  GetRevisionResponse,
  LocalDocument,
  LocalDocumentRevision,
  PatchDocumentResponse,
  PostDocumentsResponse,
  PostRevisionResponse,
  UserDocument,
} from '@/types';
import type { AppStore } from './store';
import { failure, announceFailure, type Result } from './result';

type RevisionKey = { id: string, documentId: string };

export interface DocumentsSlice {
  documents: UserDocument[];
  loadLocalDocuments: () => Promise<Result<LocalDocument[]>>;
  loadCloudDocuments: () => Promise<Result<CloudDocument[]>>;
  getLocalStorageUsage: () => Promise<Result<DocumentStorageUsage[]>>;
  getCloudStorageUsage: () => Promise<Result<DocumentStorageUsage[]>>;

  getLocalDocument: (id: string) => Promise<Result<EditorDocument>>;
  createLocalDocument: (input: DocumentCreateInput) => Promise<Result<LocalDocument>>;
  updateLocalDocument: (input: { id: string, partial: DocumentUpdateInput }) => Promise<Result<Partial<LocalDocument>>>;
  deleteLocalDocument: (id: string) => Promise<Result<string>>;
  forkLocalDocument: (input: { id: string, revisionId?: string | null }) => Promise<Result<EditorDocument>>;

  getCloudDocument: (id: string) => Promise<Result<NonNullable<GetDocumentResponse["data"]>>>;
  createCloudDocument: (input: DocumentCreateInput) => Promise<Result<CloudDocument>>;
  updateCloudDocument: (input: { id: string, partial: DocumentUpdateInput }) => Promise<Result<CloudDocument>>;
  deleteCloudDocument: (id: string) => Promise<Result<string>>;
  forkCloudDocument: (input: { id: string, revisionId?: string | null }) => Promise<Result<NonNullable<ForkDocumentResponse["data"]>>>;

  getLocalDocumentRevisions: (id: string) => Promise<Result<EditorDocumentRevision[]>>;
  getLocalRevision: (id: string) => Promise<Result<EditorDocumentRevision>>;
  getCloudRevision: (id: string) => Promise<Result<EditorDocumentRevision>>;
  createLocalRevision: (revision: EditorDocumentRevision) => Promise<Result<LocalDocumentRevision>>;
  createCloudRevision: (revision: EditorDocumentRevision) => Promise<Result<CloudDocumentRevision>>;
  deleteLocalRevision: (revision: RevisionKey) => Promise<Result<RevisionKey>>;
  deleteCloudRevision: (revision: RevisionKey) => Promise<Result<RevisionKey>>;
}

// sets the local or cloud copy of a document, adding the document to the start or end of the list when it is new
const upsertDocument = (documents: UserDocument[], document: UserDocument, at: "start" | "end" = "start") => {
  if (!documents.some(doc => doc.id === document.id)) return at === "start" ? [document, ...documents] : [...documents, document];
  return documents.map(doc => doc.id === document.id ? { ...doc, ...document } : doc);
};

const updateDocument = (documents: UserDocument[], id: string, update: (document: UserDocument) => UserDocument) => {
  return documents.map(doc => doc.id === id ? update(doc) : doc);
};

// drops the local or cloud copy of a document, and the document itself when no other copy is left
const removeDocumentCopy = (documents: UserDocument[], id: string, copy: "local" | "cloud") => {
  const other = copy === "local" ? "cloud" : "local";
  return documents.flatMap(doc => {
    if (doc.id !== id) return [doc];
    if (!doc[other]) return [];
    const { [copy]: _, ...rest } = doc;
    return [rest];
  });
};

export const createDocumentsSlice: StateCreator<AppStore, [], [], DocumentsSlice> = (set) => ({
  documents: [],
  loadLocalDocuments: async () => {
    try {
      const documents = await documentDB.getAll();
      const revisions = await revisionDB.getAll();
      const localDocuments: LocalDocument[] = documents.map(({ data, ...document }) => {
        const localRevisions = revisions.filter(revision => revision.documentId === document.id).map(({ data, ...rest }) => rest);
        return { ...document, revisions: localRevisions };
      });
      set(state => ({ documents: localDocuments.reduce((documents, local) => upsertDocument(documents, { id: local.id, local }, "end"), state.documents) }));
      return { data: localDocuments };
    } catch (error) {
      return failure(error);
    }
  },
  loadCloudDocuments: async () => {
    try {
      NProgress.start();
      const response = await fetch('/api/documents');
      const { data = [], error } = await response.json() as GetDocumentsResponse;
      if (error) return { error };
      set(state => ({ documents: data.reduce((documents, cloud) => upsertDocument(documents, { id: cloud.id, cloud }, "end"), state.documents) }));
      return { data };
    } catch (error) {
      return failure(error);
    } finally {
      NProgress.done();
    }
  },
  getLocalStorageUsage: async () => {
    try {
      const documents = await documentDB.getAll();
      const revisions = await revisionDB.getAll();
      const localStorageUsage = documents.sort((a, b) => {
        const first = a.updatedAt;
        const second = b.updatedAt;
        if (!first && !second) return 0;
        if (!first) return 1;
        if (!second) return -1;
        return new Date(second).getTime() - new Date(first).getTime();
      }).map(document => {
        const backupDocument: BackupDocument = { ...document, revisions: revisions.filter(revision => revision.documentId === document.id) };
        const backupDocumentSize = new Blob([JSON.stringify(backupDocument)]).size;
        return { id: document.id, name: document.name, size: backupDocumentSize };
      });
      return { data: localStorageUsage };
    } catch (error) {
      return failure(error);
    }
  },
  getCloudStorageUsage: async () => {
    try {
      const response = await fetch('/api/usage');
      const { data, error } = await response.json() as GetDocumentStorageUsageResponse;
      if (error || !data) return { error: error ?? { title: "Something went wrong", subtitle: "failed to get cloud storage usage" } };
      return { data };
    } catch (error) {
      return failure(error);
    }
  },

  getLocalDocument: async (id) => {
    try {
      const document = validate(id) ? await documentDB.getByID(id) : await documentDB.getOneByKey("handle", id);
      if (!document) return { error: { title: "Something went wrong", subtitle: "document not found" } };
      return { data: document };
    } catch (error) {
      return failure(error);
    }
  },
  createLocalDocument: async (input) => {
    try {
      const { coauthors, published, collab, private: isPrivate, revisions, ...document } = input;
      const id = await documentDB.add(document);
      if (!id) return { error: { title: "Something went wrong", subtitle: "failed to create document" } };
      if (revisions) await revisionDB.addMany(revisions);
      const { data, ...rest } = document;
      const local: LocalDocument = { ...rest, revisions: (revisions ?? []).map(({ data, ...rest }) => rest) };
      set(state => ({ documents: upsertDocument(state.documents, { id: local.id, local }) }));
      return { data: local };
    } catch (error) {
      return failure(error);
    }
  },
  updateLocalDocument: async ({ id, partial }) => {
    try {
      const { coauthors, published, collab, private: isPrivate, revisions, ...document } = partial;
      const result = await documentDB.patch(id, document);
      if (!result) return { error: { title: "Something went wrong", subtitle: "failed to update document" } };
      const { data, ...rest } = document;
      const patch: Partial<LocalDocument> = { ...rest };
      if (revisions) {
        await revisionDB.addMany(revisions);
        patch.revisions = revisions.map(({ data, ...rest }) => rest);
      }
      set(state => ({ documents: updateDocument(state.documents, id, doc => doc.local ? { ...doc, local: { ...doc.local, ...patch } } : doc) }));
      return { data: patch };
    } catch (error) {
      return failure(error);
    }
  },
  deleteLocalDocument: async (id) => {
    try {
      await documentDB.deleteByID(id);
      await revisionDB.deleteManyByKey("documentId", id);
      set(state => ({ documents: removeDocumentCopy(state.documents, id, "local") }));
      return { data: id };
    } catch (error) {
      return failure(error);
    }
  },
  forkLocalDocument: async ({ id, revisionId }) => {
    try {
      const document = validate(id) ? await documentDB.getByID(id) : await documentDB.getOneByKey("handle", id);
      if (!document) return { error: { title: "Something went wrong", subtitle: "document not found" } };
      if (!revisionId || revisionId === document.head) return { data: document };
      const revision = await revisionDB.getByID(revisionId);
      if (!revision) return { error: { title: "Something went wrong", subtitle: "revision not found" } };
      return { data: { ...document, head: revision.id, updatedAt: revision.createdAt, data: revision.data } };
    } catch (error) {
      return failure(error);
    }
  },

  getCloudDocument: async (id) => {
    try {
      NProgress.start();
      const response = await fetch(`/api/documents/${id}`);
      const { data, error } = await response.json() as GetDocumentResponse;
      if (error || !data) return { error: error ?? { title: "Something went wrong", subtitle: "document not found" } };
      const { cloudDocument: cloud } = data;
      set(state => ({ documents: upsertDocument(state.documents, { id: cloud.id, cloud }) }));
      return { data };
    } catch (error) {
      return failure(error);
    } finally {
      NProgress.done();
    }
  },
  createCloudDocument: async (input) => {
    try {
      NProgress.start();
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const { data, error } = await response.json() as PostDocumentsResponse;
      if (error || !data) return announceFailure({ error: error ?? { title: "Something went wrong", subtitle: "failed to create document" } });
      set(state => ({ documents: upsertDocument(state.documents, { id: data.id, cloud: data }) }));
      return { data };
    } catch (error) {
      return announceFailure(failure(error));
    } finally {
      NProgress.done();
    }
  },
  updateCloudDocument: async ({ id, partial }) => {
    try {
      NProgress.start();
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      const { data, error } = await response.json() as PatchDocumentResponse;
      if (error || !data) return announceFailure({ error: error ?? { title: "Something went wrong", subtitle: "failed to update document" } });
      set(state => ({ documents: upsertDocument(state.documents, { id: data.id, cloud: data }) }));
      return { data };
    } catch (error) {
      return announceFailure(failure(error));
    } finally {
      NProgress.done();
    }
  },
  deleteCloudDocument: async (id) => {
    try {
      NProgress.start();
      const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      const { data, error } = await response.json() as DeleteDocumentResponse;
      if (error || !data) return announceFailure({ error: error ?? { title: "Something went wrong", subtitle: "failed to delete document" } });
      set(state => ({ documents: removeDocumentCopy(state.documents, data, "cloud") }));
      return { data };
    } catch (error) {
      return announceFailure(failure(error));
    } finally {
      NProgress.done();
    }
  },
  forkCloudDocument: async ({ id, revisionId }) => {
    try {
      NProgress.start();
      const response = await fetch(`/api/documents/new/${id}${revisionId ? `?v=${revisionId}` : ''}`);
      const { data, error } = await response.json() as ForkDocumentResponse;
      if (error || !data) return announceFailure({ error: error ?? { title: "Something went wrong", subtitle: "document not found" } });
      return { data };
    } catch (error) {
      return announceFailure(failure(error));
    } finally {
      NProgress.done();
    }
  },

  getLocalDocumentRevisions: async (id) => {
    try {
      const revisions = await revisionDB.getManyByKey("documentId", id);
      return { data: revisions };
    } catch (error) {
      return failure(error);
    }
  },
  getLocalRevision: async (id) => {
    try {
      const revision = await revisionDB.getByID(id);
      if (!revision) return { error: { title: "Something went wrong", subtitle: "revision not found" } };
      return { data: revision };
    } catch (error) {
      return failure(error);
    }
  },
  getCloudRevision: async (id) => {
    try {
      NProgress.start();
      const response = await fetch(`/api/revisions/${id}`);
      const { data, error } = await response.json() as GetRevisionResponse;
      if (error || !data) return announceFailure({ error: error ?? { title: "Something went wrong", subtitle: "revision not found" } });
      return { data };
    } catch (error) {
      return announceFailure(failure(error));
    } finally {
      NProgress.done();
    }
  },
  createLocalRevision: async (revision) => {
    try {
      const id = await revisionDB.add(revision);
      if (!id) return { error: { title: "Something went wrong", subtitle: "failed to create revision" } };
      const { data, ...localRevision } = revision;
      set(state => ({
        documents: updateDocument(state.documents, revision.documentId, doc => doc.local ? { ...doc, local: { ...doc.local, revisions: [localRevision, ...doc.local.revisions] } } : doc)
      }));
      return { data: localRevision };
    } catch (error) {
      return failure(error);
    }
  },
  createCloudRevision: async (revision) => {
    try {
      NProgress.start();
      const response = await fetch('/api/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(revision),
      });
      const { data, error } = await response.json() as PostRevisionResponse;
      if (error || !data) return announceFailure({ error: error ?? { title: "Something went wrong", subtitle: "failed to create revision" } });
      set(state => ({
        documents: updateDocument(state.documents, data.documentId, doc => doc.cloud ? { ...doc, cloud: { ...doc.cloud, revisions: [data, ...doc.cloud.revisions] } } : doc)
      }));
      return { data };
    } catch (error) {
      return announceFailure(failure(error));
    } finally {
      NProgress.done();
    }
  },
  deleteLocalRevision: async ({ id, documentId }) => {
    try {
      await revisionDB.deleteByID(id);
      set(state => ({
        documents: updateDocument(state.documents, documentId, doc => doc.local ? { ...doc, local: { ...doc.local, revisions: doc.local.revisions.filter(revision => revision.id !== id) } } : doc)
      }));
      return { data: { id, documentId } };
    } catch (error) {
      return failure(error);
    }
  },
  deleteCloudRevision: async ({ id }) => {
    try {
      NProgress.start();
      const response = await fetch(`/api/revisions/${id}`, { method: 'DELETE' });
      const { data, error } = await response.json() as DeleteRevisionResponse;
      if (error || !data) return announceFailure({ error: error ?? { title: "Something went wrong", subtitle: "failed to delete revision" } });
      set(state => ({
        documents: updateDocument(state.documents, data.documentId, doc => doc.cloud ? { ...doc, cloud: { ...doc.cloud, revisions: doc.cloud.revisions.filter(revision => revision.id !== data.id) } } : doc)
      }));
      return { data };
    } catch (error) {
      return announceFailure(failure(error));
    } finally {
      NProgress.done();
    }
  },
});
