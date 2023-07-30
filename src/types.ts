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
  admin?: Admin;
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

export type UserDocument = Omit<EditorDocument, "data"> & { variant: DocumentVariant };
export type AdminDocument = UserDocument & { author: Omit<User, "documents"> };
export type AdminUser = User & { documents: UserDocument[] };

export interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  role: "user" | "superuser" | "admin";
  createdAt: string;
  updatedAt: string;
  disabled: boolean;
}

export interface Admin {
  users: AdminUser[];
  documents: AdminDocument[];
}
