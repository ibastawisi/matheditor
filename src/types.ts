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
export type DocumentVariant = "local" | "cloud";

export interface AppState {
  user?: User;
  documents: UserDocument[];
  announcements: Announcement[];
  alerts: Alert[];
  initialized: boolean;
}

export interface EditorDocument {
  id: string;
  name: string;
  data: SerializedEditorState;
  createdAt: string | Date;
  updatedAt: string | Date;
  published?: boolean;
  handle?: string | null;
  baseId?: string | null;
  head?: string | null;
}

export interface DocumentRevision {
  id: string;
  documentId: string;
  createdAt: string | Date;
  author: User;
}

export interface EditorDocumentRevision extends DocumentRevision {
  data: SerializedEditorState;
}

type UserDocumentBase = Omit<EditorDocument, "data"> & { variant: DocumentVariant; };
export type LocalDocument = UserDocumentBase & { variant: "local" }
export type CloudDocument = UserDocumentBase & { variant: "cloud", author: User; coauthors: User[], revisions: DocumentRevision[] }
export type UserDocument = LocalDocument | CloudDocument;

export const isLocalDocument = (document: UserDocument): document is LocalDocument => document.variant === "local";
export const isCloudDocument = (document: UserDocument): document is CloudDocument => document.variant === "cloud";

export type UserRole = "user" | "superuser" | "admin";

export interface User {
  id: string;
  handle: string | null;
  name: string;
  email: string;
  image: string | null;
}

export type UserSessionStatus = "authenticated" | "unauthenticated" | "loading";

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

export interface CheckHandleResponse {
  data?: boolean;
  error?: string;
}

export interface GetRevisionResponse {
  data?: EditorDocumentRevision;
  error?: string;
}

export interface PostRevisionResponse {
  data?: DocumentRevision;
  error?: string;
}

export interface DeleteRevisionResponse {
  data?: { id: string; documentId: string; };
  error?: string;
}

