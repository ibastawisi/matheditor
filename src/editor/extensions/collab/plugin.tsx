"use client"
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { LexicalCollaboration } from "@lexical/react/LexicalCollaborationContext";
import { useEffect, useMemo, useRef, useState } from "react";
import type { WebsocketProvider } from "y-websocket";
import type { Collaborator, CollabSession, CollabStatus } from "@/types";
import { createProviderFactory } from "./provider";
import "./index.css";

/** Cursor colors that read on both light and dark pages */
const COLORS = ["#e53935", "#8e24aa", "#3949ab", "#039be5", "#00897b", "#43a047", "#f4511e", "#6d4c41", "#d81b60", "#5e35b1"];

/** Each user keeps the same color on every client */
export function getCollaboratorColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface AwarenessUser {
  name?: string;
  color?: string;
  awarenessData?: { id?: string; image?: string | null };
}

/** The other users in the session, once each however many tabs they have open */
function getCollaborators(provider: WebsocketProvider, userId: string): Collaborator[] {
  const collaborators = new Map<string, Collaborator>();
  for (const [clientId, state] of provider.awareness.getStates() as Map<number, AwarenessUser>) {
    const id = state.awarenessData?.id;
    if (clientId === provider.awareness.clientID || !id || id === userId || collaborators.has(id)) continue;
    collaborators.set(id, {
      clientId,
      id,
      name: state.name ?? "",
      image: state.awarenessData?.image ?? null,
      color: state.color ?? getCollaboratorColor(id),
    });
  }
  return [...collaborators.values()];
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
  const latest = useRef(props);
  latest.current = props;
  const cursorsRef = useRef<HTMLDivElement>(null);

  // created once: a new factory would make the plugin replace its provider
  const [{ factory, destroy }] = useState(() =>
    createProviderFactory({
      url: session.url,
      token: session.token,
      refreshToken: () => latest.current.refreshToken(),
      onStatus: (status) => latest.current.onStatus(status),
      onSync: (synced) => latest.current.onSync(synced),
      onClosed: () => latest.current.onClosed(),
      onAwareness: (provider) => latest.current.onCollaborators(getCollaborators(provider, session.user.id)),
    })
  );
  useEffect(() => destroy, [destroy]);

  // the plugin reconnects whenever these change identity
  const color = useMemo(() => getCollaboratorColor(session.user.id), [session.user.id]);
  const awarenessData = useMemo(() => ({ id: session.user.id, image: session.user.image }), [session.user.id, session.user.image]);

  return (
    <>
      <div ref={cursorsRef} className="editor-collab-cursors" />
      <LexicalCollaboration>
        <CollaborationPlugin
          id={documentId}
          providerFactory={factory}
          // the server starts every session from the document's saved content
          shouldBootstrap={false}
          username={session.user.name}
          cursorColor={color}
          awarenessData={awarenessData}
          cursorsContainerRef={cursorsRef}
          selectionHighlight
        />
      </LexicalCollaboration>
    </>
  );
};

export default LiveCollaborationPlugin;
