/**
 * Live editing server. Relays DocNode document operations and presence
 * (cursors and selections) between the editors of a document, and stores each
 * document's DocNode snapshot in S3 object storage.
 *
 * The app seeds a document's state and signs a short-lived token for each
 * user it lets in, so this server only checks the token and never reads
 * sessions or permissions itself.
 */
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { defineNode, defineState, Doc, type JsonDoc, type Operations } from "@docukit/docnode";
import { WebSocketServer, type WebSocket } from "ws";

const PORT = Number(process.env.PORT ?? 1234);
const SECRET = process.env.COLLAB_SECRET;
if (!SECRET) {
  console.error("COLLAB_SECRET is required");
  process.exit(1);
}

const S3_BUCKET = process.env.S3_BUCKET || "matheditor";
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE ? process.env.S3_FORCE_PATH_STYLE === "true" : true;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "rustfsadmin";
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || "rustfsadmin";

const s3 = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  forcePathStyle: S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

const getCollabKey = (id: string) => `collab/${id}.json`;

/** Wait this long after the last update before storing a document */
const PERSIST_DEBOUNCE_MS = 2000;
/** but store a document that never stops changing at least this often */
const PERSIST_MAX_WAIT_MS = 10000;
const PING_INTERVAL_MS = 30000;
/** Documents may hold images as data URLs */
const MAX_PAYLOAD_BYTES = 64 * 1024 * 1024;

const CLOSE_UNAUTHORIZED = 4401;
const CLOSE_NOT_FOUND = 4404;
const CLOSE_SERVER_ERROR = 1011;

interface ClientUser {
  id: string;
  name: string;
  image: string | null;
  color: string;
}

interface PresenceSelection {
  anchor: { key: string; offset: number };
  focus: { key: string; offset: number };
  name: string;
  color: string;
}

interface ClientPresence {
  user: ClientUser;
  selection?: PresenceSelection;
}

type ClientMessage =
  | { type: "ops"; operations: Operations }
  | { type: "presence"; user: ClientUser; selection?: PresenceSelection };

type ServerMessage =
  | { type: "init"; clientId: string; doc: JsonDoc; presence: Record<string, ClientPresence> }
  | { type: "ops"; operations: Operations }
  | { type: "presence"; clientId: string; state: ClientPresence | null };

interface Room {
  id: string;
  doc: Doc;
  conns: Map<WebSocket, string>;
  presence: Map<string, ClientPresence>;
  dirty: boolean;
  persistTimer: ReturnType<typeof setTimeout> | null;
  firstDirtyAt: number;
  persisting: Promise<void> | null;
}

const LexicalRootDocNode = defineNode({
  type: "docnode-lexical",
  state: { r: defineState({ fromJSON: (json) => json ?? null }) },
});

const LexicalDocNode = defineNode({
  type: "l",
  state: { j: defineState({ fromJSON: (json) => json ?? {} }) },
});

const docConfig = {
  type: "docnode-lexical",
  extensions: [{ nodes: [LexicalRootDocNode, LexicalDocNode] }],
};
const rooms = new Map<string, Promise<Room | null>>();

function verifyToken(token: string, documentId: string): boolean {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = createHmac("sha256", SECRET!).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const { d, e } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return d === documentId && typeof e === "number" && e > Date.now();
  } catch {
    return false;
  }
}

function send(conn: WebSocket, message: ServerMessage | string) {
  if (conn.readyState !== conn.OPEN) return;
  const payload = typeof message === "string" ? message : JSON.stringify(message);
  conn.send(payload, (error) => {
    if (error) conn.terminate();
  });
}

function broadcast(room: Room, message: ServerMessage, except?: WebSocket) {
  const payload = JSON.stringify(message);
  for (const conn of room.conns.keys()) {
    if (conn !== except) send(conn, payload);
  }
}

async function persist(room: Room): Promise<void> {
  if (room.persistTimer) clearTimeout(room.persistTimer);
  room.persistTimer = null;
  // one write at a time; a write that starts later stores the newer state
  while (room.persisting) await room.persisting;
  if (!room.dirty) return;
  room.dirty = false;
  const state = JSON.stringify(room.doc.toJSON());
  room.persisting = s3
    .send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: getCollabKey(room.id),
        Body: state,
        ContentType: "application/json",
        IfMatch: "*",
      })
    )
    .then(() => {})
    .catch((error) => {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      const name = (error as Error).name;
      if (status === 404 || status === 412 || name === "NoSuchKey" || name === "NotFound" || name === "PreconditionFailed") {
        return;
      }
      console.error(`failed to store ${room.id}`, error);
      room.dirty = true;
      schedulePersist(room);
    })
    .finally(() => {
      room.persisting = null;
    });
  await room.persisting;
}

function schedulePersist(room: Room) {
  const now = Date.now();
  if (!room.dirty) room.firstDirtyAt = now;
  room.dirty = true;
  if (room.persistTimer) clearTimeout(room.persistTimer);
  const wait = Math.min(PERSIST_DEBOUNCE_MS, Math.max(0, room.firstDirtyAt + PERSIST_MAX_WAIT_MS - now));
  room.persistTimer = setTimeout(() => void persist(room), wait);
}

async function loadRoom(id: string): Promise<Room | null> {
  let text: string;
  try {
    const response = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: getCollabKey(id) }));
    if (!response.Body) return null;
    text = await response.Body.transformToString();
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    const name = (error as Error).name;
    if (status === 404 || name === "NoSuchKey" || name === "NotFound") return null;
    throw error;
  }
  const doc = Doc.fromJSON(docConfig, JSON.parse(text) as JsonDoc);
  doc.forceCommit();
  return {
    id,
    doc,
    conns: new Map(),
    presence: new Map(),
    dirty: false,
    persistTimer: null,
    firstDirtyAt: 0,
    persisting: null,
  };
}

function getRoom(id: string): Promise<Room | null> {
  let room = rooms.get(id);
  if (!room) {
    room = loadRoom(id);
    rooms.set(id, room);
    // a document that was not found, or failed to load, is looked up again next time
    room.then((loaded) => { if (!loaded) rooms.delete(id); }, () => rooms.delete(id));
  }
  return room;
}

async function closeConnection(room: Room, conn: WebSocket) {
  const clientId = room.conns.get(conn);
  if (!clientId) return;
  room.conns.delete(conn);
  if (room.presence.delete(clientId)) {
    broadcast(room, { type: "presence", clientId, state: null });
  }
  if (room.conns.size > 0) return;
  await persist(room);
  // someone may have joined while the document was being stored
  if (room.conns.size > 0) return;
  rooms.delete(room.id);
  room.doc.dispose();
}

function onMessage(room: Room, conn: WebSocket, raw: string) {
  const clientId = room.conns.get(conn);
  if (!clientId) return;
  const message = JSON.parse(raw) as ClientMessage;
  switch (message.type) {
    case "ops":
      room.doc.applyOperations(message.operations, { skipUndo: true });
      broadcast(room, { type: "ops", operations: message.operations }, conn);
      schedulePersist(room);
      break;
    case "presence": {
      const state: ClientPresence = { user: message.user, selection: message.selection };
      room.presence.set(clientId, state);
      broadcast(room, { type: "presence", clientId, state }, conn);
      break;
    }
  }
}

async function onConnection(conn: WebSocket, documentId: string) {
  // hold messages that arrive while the document loads
  const pending: string[] = [];
  const queue = (data: Buffer) => pending.push(data.toString("utf8"));
  conn.on("message", queue);

  let room: Room | null;
  try {
    room = await getRoom(documentId);
  } catch (error) {
    console.error(`failed to load ${documentId}`, error);
    conn.close(CLOSE_SERVER_ERROR, "Failed to load the document");
    return;
  }
  if (!room) {
    conn.close(CLOSE_NOT_FOUND, "Document not found");
    return;
  }
  if (conn.readyState !== conn.OPEN) return;
  const joined = room;
  const clientId = randomUUID();
  joined.conns.set(conn, clientId);

  conn.off("message", queue);
  conn.on("message", (data: Buffer) => {
    try {
      onMessage(joined, conn, data.toString("utf8"));
    } catch (error) {
      console.error(`bad message for ${documentId}`, error);
      conn.close(CLOSE_SERVER_ERROR);
    }
  });
  conn.on("close", () => void closeConnection(joined, conn));

  let alive = true;
  conn.on("pong", () => { alive = true; });
  const ping = setInterval(() => {
    if (!alive) {
      conn.terminate();
      return;
    }
    alive = false;
    conn.ping();
  }, PING_INTERVAL_MS);
  conn.on("close", () => clearInterval(ping));

  // send the current snapshot and who is already here
  send(conn, {
    type: "init",
    clientId,
    doc: joined.doc.toJSON(),
    presence: Object.fromEntries(joined.presence),
  });

  for (const raw of pending) onMessage(joined, conn, raw);
}

const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "Content-Type": "text/plain" }).end("ok");
    return;
  }
  response.writeHead(404).end();
});

const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD_BYTES });

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const documentId = decodeURIComponent(url.pathname.slice(1));
  const token = url.searchParams.get("token") ?? "";
  wss.handleUpgrade(request, socket, head, (conn) => {
    // rejected after the upgrade, so that the client sees the close code and stops retrying
    if (!verifyToken(token, documentId)) {
      conn.close(CLOSE_UNAUTHORIZED, "Unauthorized");
      return;
    }
    void onConnection(conn, documentId);
  });
});

server.listen(PORT, () => console.log(`collab server listening on ${PORT}`));

async function shutdown() {
  server.close();
  for (const conn of wss.clients) conn.close(1012, "Server restarting");
  const loaded = await Promise.allSettled(rooms.values());
  await Promise.allSettled(
    loaded.flatMap((result) => (result.status === "fulfilled" && result.value ? [persist(result.value)] : []))
  );
  s3.destroy();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
