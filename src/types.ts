"use client"
import type { SerializedEditorState } from 'lexical';

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
  createdAt: string;
  updatedAt: string;
  published?: boolean;
  baseId?: string;
}

type UserDocumentBase = Omit<EditorDocument, "data"> & { variant: DocumentVariant };
export type LocalDocument = UserDocumentBase & { variant: "local" }
export type CloudDocument = UserDocumentBase & { variant: "cloud", author: User; }
export type UserDocument = LocalDocument | CloudDocument;

export const isLocalDocument = (document: UserDocument): document is LocalDocument => document.variant === "local";
export const isCloudDocument = (document: UserDocument): document is CloudDocument => document.variant === "cloud";
export type CloudDocumentResponse = Omit<CloudDocument, "variant">;
export type UserRole = "user" | "superuser" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  disabled: boolean;
}

export type UserSessionStatus = "authenticated" | "unauthenticated" | "loading";
export interface GetAdminResponse {
  data?: {
    users: User[];
    documents: CloudDocumentResponse[];
  }
  error?: string;
}

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
  data?: CloudDocumentResponse[];
  error?: string;
}

export interface PostDocumentsResponse {
  data?: CloudDocumentResponse;
  error?: string;
}

export interface GetPublishedDocumentsResponse {
  data?: CloudDocumentResponse[];
  error?: string;
}

export interface GetDocumentResponse {
  data?: EditorDocument & CloudDocumentResponse;
  error?: string;
}

export interface PatchDocumentResponse {
  data?: CloudDocumentResponse;
  error?: string;
}

export interface DeleteDocumentResponse {
  data?: string;
  error?: string;
}
