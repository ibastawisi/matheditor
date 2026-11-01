import { Doc, type JsonDoc, type Operations } from "@docukit/docnode";
import type { LexicalPresence, Presence, PresenceSelection } from "@docukit/docnode-lexical";
import type { Collaborator, CollabStatus } from "@/types";
import { createDocumentDocNodeConfig } from "./docConfig";

/** The server turned the token down, most likely because it expired */
const CLOSE_UNAUTHORIZED = 4401;
/** Close codes in 4400-4499 stop the client from reconnecting on its own */
const isFatalClose = (code: number) => code >= 4400 && code < 4500;
/** Fresh tokens to try before giving up, reset by every successful sync */
const MAX_TOKEN_REFRESHES = 3;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const MAX_UNDO_STEPS = 100;

const docConfig = createDocumentDocNodeConfig({ undoManager: { maxUndoSteps: MAX_UNDO_STEPS } });

export interface ClientUser {
  id: string;
  name: string;
  image: string | null;
  color: string;
}

interface ClientPresence {
  user: ClientUser;
  selection?: LexicalPresence;
}

type ServerMessage =
  | { type: "init"; clientId: string; doc: JsonDoc; presence: Record<string, ClientPresence> }
  | { type: "ops"; operations: Operations }
  | { type: "presence"; clientId: string; state: ClientPresence | null };

export interface CollabProviderOptions {
  url: string;
  documentId: string;
  token: string;
  user: ClientUser;
  /** A new token for the same session, or null when the user can no longer join it */
  refreshToken: () => Promise<string | null>;
  onDoc: (doc: Doc) => void;
  onPresence: (presence: Presence) => void;
  onStatus: (status: CollabStatus) => void;
  onSync: (synced: boolean) => void;
  /** The server closed the session for good */
  onClosed: () => void;
  /** Who is in the session changed */
  onCollaborators: (collaborators: Collaborator[]) => void;
}

export interface CollabProvider {
  setPresence: (selection: PresenceSelection | undefined) => void;
  destroy: () => void;
}

/**
 * Connects a document to the live editing server over WebSocket, syncing its
 * DocNode state, undo history across reconnects, and remote presence.
 *
 * Tokens are only checked when a connection opens, so a client that reconnects
 * after its token expired asks for a new one.
 */
export function createCollabProvider(options: CollabProviderOptions): CollabProvider {
  let token = options.token;
  let ws: WebSocket | null = null;
  let doc: Doc | null = null;
  let offChange: (() => void) | null = null;
  let clientId: string | null = null;
  let applyingRemote = false;
  let destroyed = false;
  let refreshes = 0;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSelection: LexicalPresence | undefined;
  const pendingOps: Operations[] = [];
  const presenceMap = new Map<string, ClientPresence>();

  const sendRaw = (payload: unknown) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  };

  const emitPresence = () => {
    if (destroyed) return;
    const cursors: Presence = {};
    const collaborators = new Map<string, Collaborator>();
    for (const [id, state] of presenceMap) {
      if (id === clientId) continue;
      if (state.selection) cursors[id] = state.selection;
      const userId = state.user.id;
      if (!userId || userId === options.user.id || collaborators.has(userId)) continue;
      collaborators.set(userId, {
        id: userId,
        name: state.user.name,
        image: state.user.image,
        color: state.user.color,
      });
    }
    options.onPresence(cursors);
    options.onCollaborators([...collaborators.values()]);
  };

  const bindDoc = (nextDoc: Doc) => {
    offChange?.();
    if (doc && doc !== nextDoc) doc.dispose();
    doc = nextDoc;
    offChange = nextDoc.onChange(({ operations }) => {
      if (applyingRemote || destroyed) return;
      if (ws && ws.readyState === WebSocket.OPEN) {
        sendRaw({ type: "ops", operations });
      } else {
        pendingOps.push(operations);
      }
    });
    options.onDoc(nextDoc);
  };

  const handleMessage = (raw: string) => {
    if (destroyed) return;
    const message = JSON.parse(raw) as ServerMessage;
    switch (message.type) {
      case "init": {
        clientId = message.clientId;
        refreshes = 0;
        reconnectAttempts = 0;
        const previousHistory = doc?.undoManager.exportHistory();
        const nextDoc = Doc.fromJSON(docConfig, message.doc);
        nextDoc.forceCommit();
        const flushed = pendingOps.splice(0);
        for (const ops of flushed) {
          nextDoc.applyOperations(ops, { skipUndo: true });
        }
        if (previousHistory && previousHistory.docId === nextDoc.root.id) {
          nextDoc.undoManager.importHistory(previousHistory);
        }
        bindDoc(nextDoc);
        for (const ops of flushed) {
          sendRaw({ type: "ops", operations: ops });
        }
        presenceMap.clear();
        for (const [id, state] of Object.entries(message.presence)) {
          presenceMap.set(id, state);
        }
        sendRaw({ type: "presence", user: options.user, selection: lastSelection });
        emitPresence();
        options.onSync(true);
        break;
      }
      case "ops": {
        if (!doc) break;
        applyingRemote = true;
        try {
          doc.applyOperations(message.operations, { skipUndo: true });
        } finally {
          applyingRemote = false;
        }
        break;
      }
      case "presence": {
        if (message.state) presenceMap.set(message.clientId, message.state);
        else presenceMap.delete(message.clientId);
        emitPresence();
        break;
      }
    }
  };

  const scheduleReconnect = () => {
    if (destroyed || reconnectTimer) return;
    const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** reconnectAttempts);
    reconnectAttempts++;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  };

  const connect = () => {
    if (destroyed) return;
    options.onStatus("connecting");
    const base = options.url.replace(/\/+$/, "");
    const socket = new WebSocket(`${base}/${encodeURIComponent(options.documentId)}?token=${encodeURIComponent(token)}`);
    ws = socket;

    socket.addEventListener("open", () => {
      if (destroyed || ws !== socket) return;
      options.onStatus("connected");
    });

    socket.addEventListener("message", (event) => {
      if (destroyed || ws !== socket || typeof event.data !== "string") return;
      handleMessage(event.data);
    });

    socket.addEventListener("close", async (event) => {
      if (destroyed || ws !== socket) return;
      ws = null;
      presenceMap.clear();
      emitPresence();
      options.onStatus("disconnected");

      if (event.code === CLOSE_UNAUTHORIZED) {
        if (refreshes >= MAX_TOKEN_REFRESHES) return options.onClosed();
        refreshes++;
        const nextToken = await options.refreshToken();
        if (destroyed) return;
        if (!nextToken) return options.onClosed();
        token = nextToken;
        connect();
        return;
      }

      if (isFatalClose(event.code)) {
        options.onClosed();
        return;
      }

      scheduleReconnect();
    });
  };

  const setPresence = (selection: PresenceSelection | undefined) => {
    if (destroyed) return;
    lastSelection = selection
      ? {
          anchor: selection.anchor,
          focus: selection.focus,
          name: selection.name ?? options.user.name,
          color: selection.color ?? options.user.color,
        }
      : undefined;
    sendRaw({ type: "presence", user: options.user, selection: lastSelection });
  };

  const destroy = () => {
    destroyed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    offChange?.();
    offChange = null;
    ws?.close();
    ws = null;
    doc?.dispose();
    doc = null;
    presenceMap.clear();
  };

  connect();

  return { setPresence, destroy };
}
