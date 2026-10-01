"use client"
import type { SerializedEditorState } from 'lexical';
import type { Session } from 'next-auth';

export interface Alert {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  buttonVariant?: "default" | "destructive";
}
export interface Announcement {
  type?: "success" | "error" | "warning" | "info";
  message: { title: string; subtitle?: string; };
  action?: {
    label: string;
    onClick: () => void;
  };
  timeout?: number;
}
export interface DocumentStorageUsage {
  id: string;
  name: string;
  size: number;
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
  revisions: LocalDocumentRevision[],
};
export type CloudDocument = Omit<EditorDocument, "data"> & {
  author: User;
  coauthors: User[],
  revisions: CloudDocumentRevision[],
  published?: boolean;
  collab?: boolean;
  private?: boolean;
};
export type UserDocument = { id: string; local?: LocalDocument; cloud?: CloudDocument; };
export type BackupDocument = EditorDocument & { revisions: EditorDocumentRevision[]; };

export type DocumentCreateInput = EditorDocument & {
  coauthors?: string[];
  published?: boolean;
  collab?: boolean;
  private?: boolean;
  baseId?: string | null;
  revisions?: EditorDocumentRevision[];
};

export type DocumentUpdateInput = Partial<EditorDocument> & {
  coauthors?: string[];
  published?: boolean;
  collab?: boolean;
  private?: boolean;
  baseId?: string | null;
  revisions?: EditorDocumentRevision[];
};

export interface EditorDocumentRevision {
  id: string;
  documentId: string;
  data: SerializedEditorState;
  createdAt: string | Date;
}

export type LocalDocumentRevision = Omit<EditorDocumentRevision, "data">;
export type CloudDocumentRevision = Omit<EditorDocumentRevision, "data"> & { author: User; };
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

export interface GetDocumentStorageUsageResponse {
  data?: DocumentStorageUsage[];
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
  data?: EditorDocument & { cloudDocument: CloudDocument };
  error?: { title: string, subtitle?: string }
}

export interface GetDocumentThumbnailResponse {
  data?: string | null;
  error?: { title: string, subtitle?: string }
}

export interface PatchDocumentResponse {
  data?: CloudDocument | null;
  error?: { title: string, subtitle?: string }
}

export interface CollabSession {
  /** The live editing server */
  url: string;
  /** Lets the user into the document's live session for a few minutes */
  token: string;
  user: Pick<User, "id" | "name" | "image">;
  /** The session was started from the copy the client sent */
  seededFromCopy?: boolean;
}

/** Sent when joining a live session, the client's own copy, to start the session from if it is newer */
export interface PostCollabSessionInput {
  data?: SerializedEditorState;
  updatedAt?: string | Date;
}

/** Someone else editing the document live */
export interface Collaborator {
  clientId: number;
  id: string;
  name: string;
  image: string | null;
  color: string;
}

export type CollabStatus = "connecting" | "connected" | "disconnected";

export interface PostCollabSessionResponse {
  data?: CollabSession;
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

export interface Pix2textResponse {
  data?: { generated_text: string; };
  error?: { title: string, subtitle?: string }
}