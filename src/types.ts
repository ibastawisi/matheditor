"use client"
import type { SerializedEditorState } from 'lexical';
import { Session } from 'next-auth';

export interface Alert {
  title: string;
  content: string;
  action?: string;
}
export interface Announcement {
  message: string;
  action?: {
    label: string;
    onClick: string;
  };
  timeout?: number;
}
export interface AppState {
  user?: User;
  documents: UserDocument[];
  revisions: LocalDocumentRevision[];
  announcements: Announcement[];
  alerts: Alert[];
  initialized: boolean;
}

export interface EditorDocument {
  id: string;
  name: string;
  head: string;
  data: SerializedEditorState;
  createdAt: string | Date;
  updatedAt: string | Date;
  published?: boolean;
  handle?: string | null;
  baseId?: string | null;
}

export type LocalDocument = Omit<EditorDocument, "data">;
export type CloudDocument = LocalDocument & { author: User; coauthors: User[], revisions: CloudDocumentRevision[] }
export type UserDocument = { id: string; local?: LocalDocument; cloud?: CloudDocument; };
export type DocumentUpdateInput = Partial<EditorDocument> & { coauthors?: string[]; };

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
  error?: string;
}

export interface GetUserResponse {
  data?: User;
  error?: string;
}

export interface PatchUserResponse {
  data?: User;
  error?: string;
}

export interface DeleteUserResponse {
  data?: string;
  error?: string;
}

export interface GetDocumentsResponse {
  data?: CloudDocument[];
  error?: string;
}

export interface PostDocumentsResponse {
  data?: CloudDocument | null;
  error?: string;
}

export interface GetPublishedDocumentsResponse {
  data?: CloudDocument[];
  error?: string;
}

export interface GetDocumentResponse {
  data?: EditorDocument;
  error?: string;
}

export interface PatchDocumentResponse {
  data?: CloudDocument | null;
  error?: string;
}

export interface DeleteDocumentResponse {
  data?: string;
  error?: string;
}

export interface ForkDocumentResponse {
  data?: UserDocument & { data: SerializedEditorState };
  error?: string;
}

export interface CheckHandleResponse {
  data?: boolean;
  error?: string;
}

export interface GetRevisionResponse {
  data?: EditorDocumentRevision;
  error?: string;
}

export interface PostRevisionResponse {
  data?: CloudDocumentRevision;
  error?: string;
}

export interface DeleteRevisionResponse {
  data?: { id: string; documentId: string; };
  error?: string;
}

