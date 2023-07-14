import type { SerializedEditorState } from './editor/types';

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
  documents: UserDocument[];
  user: User | null;
  ui: {
    isLoading: boolean;
    isSaving: boolean;
    announcements: Announcement[];
    alerts: Alert[];
  };
  admin: {
    users: User[];
    documents: AdminDocument[];
  } | null;
}

export interface EditorDocument {
  id: string;
  name: string;
  data: SerializedEditorState;
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
}
export type DocumentWithUserId = UserDocument & { userId: string; };
export type DocumentWithAuthor = UserDocument & { author: User; };
export type AdminDocument = DocumentWithUserId & DocumentWithAuthor;
export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  admin: boolean;
  createdAt: string;
  updatedAt: string;
  documents: UserDocument[];
}

export type UserDocument = Omit<EditorDocument, "data">;
