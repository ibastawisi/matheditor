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
export type DocumentVariant = "local" | "cloud" | "published" | "admin";
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

export type UserDocument = Omit<EditorDocument, "data"> & {
  variant: DocumentVariant,
  author: {
    id: string;
    name: string;
    image: string;
    email: string;
    role: UserRole;
  }
}

export type CloudDocument = Omit<UserDocument, "variant">;

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

export interface Admin {
  users: User[];
  documents: UserDocument[];
}
