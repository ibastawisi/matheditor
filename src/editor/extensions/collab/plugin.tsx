"use client"
import type { Doc } from "@docukit/docnode";
import type { Presence, PresenceSelection } from "@docukit/docnode-lexical";
import { DocNodePlugin } from "@docukit/docnode-lexical/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Collaborator, CollabSession, CollabStatus } from "@/types";
import { syncRootStateWithDoc } from "./docConfig";
import { createCollabProvider, type CollabProvider } from "./provider";

/** Cursor colors that read on both light and dark pages */
const COLORS = ["#e53935", "#8e24aa", "#3949ab", "#039be5", "#00897b", "#43a047", "#f4511e", "#6d4c41", "#d81b60", "#5e35b1"];

/** Each user keeps the same color on every client */
export function getCollaboratorColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export interface LiveCollaborationProps {
  documentId: string;
  session: CollabSession;
  refreshToken: () => Promise<string | null>;
  onStatus: (status: CollabStatus) => void;
  onSync: (synced: boolean) => void;
  onClosed: () => void;
  onCollaborators: (collaborators: Collaborator[]) => void;
}

/**
 * Edits the document together with everyone else in its live session: syncs
 * the content through the live editing server, shows the others' cursors and
 * selections, and swaps the editor's history for one that only undoes the
 * user's own changes. The editor must start empty, the content comes from the
 * session.
 */
export const LiveCollaborationPlugin: React.FC<LiveCollaborationProps> = (props) => {
  const { documentId, session } = props;
  const [editor] = useLexicalComposerContext();
  const latest = useRef(props);
  latest.current = props;

  const [doc, setDoc] = useState<Doc | null>(null);
  const [presence, setPresenceState] = useState<Presence>();

  const color = useMemo(() => getCollaboratorColor(session.user.id), [session.user.id]);
  const user = useMemo(() => ({ name: session.user.name, color }), [session.user.name, color]);
  const providerRef = useRef<CollabProvider | null>(null);
  const setPresence = useCallback((selection: PresenceSelection | undefined) => {
    providerRef.current?.setPresence(selection);
  }, []);

  useEffect(() => {
    const provider = createCollabProvider({
      url: session.url,
      documentId,
      token: session.token,
      user: {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image,
        color: getCollaboratorColor(session.user.id),
      },
      refreshToken: () => latest.current.refreshToken(),
      onDoc: (nextDoc) => setDoc(nextDoc),
      onPresence: (nextPresence) => setPresenceState(nextPresence),
      onStatus: (status) => latest.current.onStatus(status),
      onSync: (synced) => latest.current.onSync(synced),
      onClosed: () => latest.current.onClosed(),
      onCollaborators: (collaborators) => latest.current.onCollaborators(collaborators),
    });
    providerRef.current = provider;
    return () => {
      providerRef.current = null;
      provider.destroy();
    };
  }, [documentId, session.url, session.token, session.user.id, session.user.name, session.user.image]);

  // registered before DocNodePlugin's effect so root attribute updates batch into its transaction
  useEffect(() => {
    if (!doc) return;
    return syncRootStateWithDoc(editor, doc);
  }, [editor, doc]);

  if (!doc) return null;

  return (
    <DocNodePlugin
      doc={doc}
      presence={presence}
      setPresence={setPresence}
      user={user}
    />
  );
};

export default LiveCollaborationPlugin;
