import { Prisma, prisma } from "@/lib/prisma";

const hasCollabState = async (documentId: string) => {
  const state = await prisma.collabState.findUnique({
    where: { documentId },
    select: { documentId: true },
  });
  return !!state;
}

/**
 * Stores the state a document's live session starts from. Returns false when
 * another request stored one first, which is kept: it may already have edits.
 */
const createCollabState = async (documentId: string, data: Uint8Array) => {
  try {
    await prisma.collabState.create({ data: { documentId, data } });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return false;
    throw error;
  }
}

export { hasCollabState, createCollabState };
