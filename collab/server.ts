/**
 * Live editing server. Relays Yjs document updates and awareness (cursors and
 * presence) between the editors of a document, speaking the y-websocket
 * protocol, and stores each document's Yjs state in S3 object storage.
 *
 * The app seeds a document's state and signs a short-lived token for each
 * user it lets in, so this server only checks the token and never reads
 * sessions or permissions itself.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { WebSocketServer, type WebSocket } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

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

const getCollabKey = (id: string) => `collab/${id}.bin`;

/** Wait this long after the last update before storing a document */
const PERSIST_DEBOUNCE_MS = 2000;
/** but store a document that never stops changing at least this often */
const PERSIST_MAX_WAIT_MS = 10000;
const PING_INTERVAL_MS = 30000;
/** Documents may hold images as data URLs */
const MAX_PAYLOAD_BYTES = 64 * 1024 * 1024;

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

/** Close codes in 4400-4499 stop y-websocket clients from reconnecting on their own */
const CLOSE_UNAUTHORIZED = 4401;
const CLOSE_NOT_FOUND = 4404;
const CLOSE_SERVER_ERROR = 1011;

interface Room {
  id: string;
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  /** Each connection and the awareness clients it controls */
  conns: Map<WebSocket, Set<number>>;
  dirty: boolean;
  persistTimer: ReturnType<typeof setTimeout> | null;
  firstDirtyAt: number;
  persisting: Promise<void> | null;
}

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

function send(conn: WebSocket, message: Uint8Array) {
  if (conn.readyState !== conn.OPEN) return;
  conn.send(message, (error) => {
    if (error) conn.terminate();
  });
}

function broadcast(room: Room, message: Uint8Array) {
  for (const conn of room.conns.keys()) send(conn, message);
}

async function persist(room: Room): Promise<void> {
  if (room.persistTimer) clearTimeout(room.persistTimer);
  room.persistTimer = null;
  // one write at a time; a write that starts later stores the newer state
  while (room.persisting) await room.persisting;
  if (!room.dirty) return;
  room.dirty = false;
  const state = Y.encodeStateAsUpdate(room.doc);
  room.persisting = s3
    .send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: getCollabKey(room.id),
        Body: state,
        ContentType: "application/octet-stream",
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
  let data: Uint8Array;
  try {
    const response = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: getCollabKey(id) }));
    if (!response.Body) return null;
    data = await response.Body.transformToByteArray();
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    const name = (error as Error).name;
    if (status === 404 || name === "NoSuchKey" || name === "NotFound") return null;
    throw error;
  }
  const doc = new Y.Doc();
  Y.applyUpdate(doc, data);
  const awareness = new awarenessProtocol.Awareness(doc);
  // the server holds no awareness state of its own
  awareness.setLocalState(null);
  const room: Room = { id, doc, awareness, conns: new Map(), dirty: false, persistTimer: null, firstDirtyAt: 0, persisting: null };

  doc.on("update", (update: Uint8Array) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    broadcast(room, encoding.toUint8Array(encoder));
    schedulePersist(room);
  });

  awareness.on("update", ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
    const changed = [...added, ...updated, ...removed];
    const controlled = room.conns.get(origin as WebSocket);
    if (controlled) {
      for (const client of added) controlled.add(client);
      for (const client of removed) controlled.delete(client);
    }
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, changed));
    broadcast(room, encoding.toUint8Array(encoder));
  });

  return room;
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
  const controlled = room.conns.get(conn);
  if (!controlled) return;
  room.conns.delete(conn);
  awarenessProtocol.removeAwarenessStates(room.awareness, Array.from(controlled), null);
  if (room.conns.size > 0) return;
  await persist(room);
  // someone may have joined while the document was being stored
  if (room.conns.size > 0) return;
  rooms.delete(room.id);
  room.awareness.destroy();
  room.doc.destroy();
}

function onMessage(room: Room, conn: WebSocket, message: Uint8Array) {
  const decoder = decoding.createDecoder(message);
  const encoder = encoding.createEncoder();
  const type = decoding.readVarUint(decoder);
  switch (type) {
    case MESSAGE_SYNC:
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.readSyncMessage(decoder, encoder, room.doc, conn);
      // a reply holds more than the message type
      if (encoding.length(encoder) > 1) send(conn, encoding.toUint8Array(encoder));
      break;
    case MESSAGE_AWARENESS:
      awarenessProtocol.applyAwarenessUpdate(room.awareness, decoding.readVarUint8Array(decoder), conn);
      break;
  }
}

async function onConnection(conn: WebSocket, documentId: string) {
  // hold messages that arrive while the document loads
  const pending: Uint8Array[] = [];
  const queue = (data: Buffer) => pending.push(new Uint8Array(data));
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
  joined.conns.set(conn, new Set());

  conn.off("message", queue);
  conn.on("message", (data: Buffer) => {
    try {
      onMessage(joined, conn, new Uint8Array(data));
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

  // start the sync, and show who is already here
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(encoder, joined.doc);
  send(conn, encoding.toUint8Array(encoder));
  const states = joined.awareness.getStates();
  if (states.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(awarenessEncoder, awarenessProtocol.encodeAwarenessUpdate(joined.awareness, Array.from(states.keys())));
    send(conn, encoding.toUint8Array(awarenessEncoder));
  }

  for (const message of pending) onMessage(joined, conn, message);
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
  // y-websocket clients connect to `${serverUrl}/${documentId}`
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
