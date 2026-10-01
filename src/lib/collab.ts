import { createHmac } from "crypto";

/** How long a client has to open its connection; the server checks it only on connect */
const TOKEN_TTL_MS = 5 * 60 * 1000;

/** The live editing server, if one is configured */
export function getCollabConfig() {
  const url = process.env.COLLAB_URL;
  const secret = process.env.COLLAB_SECRET;
  if (!url || !secret) return null;
  return { url, secret };
}

/**
 * Signs a token that lets `userId` join the live session of `documentId`.
 * The collab server verifies it with the same secret, so it never needs to
 * read sessions or permissions itself.
 */
export function signCollabToken(secret: string, documentId: string, userId: string) {
  const payload = Buffer.from(JSON.stringify({ d: documentId, u: userId, e: Date.now() + TOKEN_TTL_MS })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}
