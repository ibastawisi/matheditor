"use client"
import type { SerializedEditorState } from 'lexical';
import type { Session } from 'next-auth';

export interface Alert {
  title: string;
  content: string;
  action?: string;
}
export interface Announcement {
  message?: { title: string; subtitle?: string; }
  action?: {
    label: string;
    onClick: string;
  };
  timeout?: number;
}
export interface AppState {
  user?: User;
  documents: UserDocument[];
  ui: {
    announcements: Announcement[];
    alerts: Alert[];
    initialized: boolean;
    drawer: boolean;
    page: number;
    filter: number;
    sort: { key: string, direction: "asc" | "desc" };
  }
}

export interface EditorDocument {
  id: string;
  name: string;
  head: string;
  data: SerializedEditorState;
  createdAt: string | Date;
  updatedAt: string | Date;
  handle?: string | null;
  baseId?: string | null;
}

export type LocalDocument = Omit<EditorDocument, "data"> & {
  revisions: LocalDocumentRevision[]
};
export type CloudDocument = Omit<EditorDocument, "data"> & {
  author: User;
  coauthors: User[],
  revisions: CloudDocumentRevision[],
  published?: boolean;
  collab?: boolean;
  private?: boolean;
}
export type UserDocument = { id: string; local?: LocalDocument; cloud?: CloudDocument; };

export type DocumentCreateInput = EditorDocument & {
  coauthors?: string[];
  published?: boolean;
  collab?: boolean;
  private?: boolean;
  baseId?: string | null;
};

export type DocumentUpdateInput = Partial<EditorDocument> & {
  coauthors?: string[];
  published?: boolean;
  collab?: boolean;
  private?: boolean;
  baseId?: string | null;
};

export interface EditorDocumentRevision {
  id: string;
  documentId: string;
  data: SerializedEditorState;
  createdAt: string | Date;
}

export type LocalDocumentRevision = Omit<EditorDocumentRevision, "data">;
export type CloudDocumentRevision = LocalDocumentRevision & { author: User; };
export type UserDocumentRevision = LocalDocumentRevision | CloudDocumentRevision;

export interface User {
  id: string;
  handle: string | null;
  name: string;
  email: string;
  image: string | null;
}

export type GetSessionResponse = Session | null;

export interface GetUsersResponse {
  data?: User[];
  error?: { title: string, subtitle?: string }
}

export interface GetUserResponse {
  data?: User;
  error?: { title: string, subtitle?: string }
}

export type UserUpdateInput = Partial<User>;
export interface PatchUserResponse {
  data?: User;
  error?: { title: string, subtitle?: string }
}

export interface DeleteUserResponse {
  data?: string;
  error?: { title: string, subtitle?: string }
}

export interface GetDocumentsResponse {
  data?: CloudDocument[];
  error?: { title: string, subtitle?: string }
}

export interface PostDocumentsResponse {
  data?: CloudDocument | null;
  error?: { title: string, subtitle?: string }
}

export interface GetPublishedDocumentsResponse {
  data?: CloudDocument[];
  error?: { title: string, subtitle?: string }
}

export interface GetDocumentResponse {
  data?: EditorDocument;
  error?: { title: string, subtitle?: string }
}

export interface PatchDocumentResponse {
  data?: CloudDocument | null;
  error?: { title: string, subtitle?: string }
}

export interface DeleteDocumentResponse {
  data?: string;
  error?: { title: string, subtitle?: string }
}

export interface ForkDocumentResponse {
  data?: UserDocument & { data: SerializedEditorState };
  error?: { title: string, subtitle?: string }
}

export interface CheckHandleResponse {
  data?: boolean;
  error?: { title: string, subtitle?: string }
}

export interface GetCloudDocumentResponse {
  data?: CloudDocument;
  error?: { title: string, subtitle?: string }
}

export interface GetRevisionResponse {
  data?: EditorDocumentRevision;
  error?: { title: string, subtitle?: string }
}

export interface PostRevisionResponse {
  data?: CloudDocumentRevision;
  error?: { title: string, subtitle?: string }
}

export interface DeleteRevisionResponse {
  data?: { id: string; documentId: string; };
  error?: { title: string, subtitle?: string }
}

