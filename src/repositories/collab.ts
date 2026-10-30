import { deleteObjects, objectExists, putObjectIfAbsent } from "@/lib/storage";
import { getCollabKey } from "@/shared/storage";

const hasCollabState = async (documentId: string) => {
  return objectExists(getCollabKey(documentId));
};

/**
 * Stores the state a document's live session starts from. Returns false when
 * another request stored one first, which is kept: it may already have edits.
 */
const createCollabState = async (documentId: string, data: Uint8Array) => {
  return putObjectIfAbsent(getCollabKey(documentId), data, "application/octet-stream");
};

const deleteCollabState = async (documentIds: string | string[]) => {
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds];
  if (!ids.length) return;
  await deleteObjects(ids.map(getCollabKey));
};

export { hasCollabState, createCollabState, deleteCollabState };
