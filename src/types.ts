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
export interface Admin {
  users: User[];
  documents: AdminDocument[];
}

export interface AppState {
  user: User | null;
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

export type UserDocument = Omit<EditorDocument, "data">;
export type AdminDocument = UserDocument & { author: Omit<User, "documents"> };

export interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  role: "user" | "superuser" | "admin";
  createdAt: string;
  updatedAt: string;
  documents: UserDocument[];
}

export interface Admin {
  users: User[];
  documents: AdminDocument[];
}
