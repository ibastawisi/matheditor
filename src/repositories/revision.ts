import { Prisma, prisma } from "@/lib/prisma";
import { deleteObjects, getObjectText, getSignedDownloadUrl, putObject, REVISION_URL_EXPIRY } from "@/lib/storage";
import { getRevisionKey } from "@/shared/storage";
import { offloadDataUrls } from "./storage";
import { EditorDocumentRevision, StoredDocumentRevision } from "@/types";
import { unstable_cache } from "next/cache";

type RevisionData = EditorDocumentRevision["data"];

/**
 * Keeps the data of a revision in object storage, with its images stored separately.
 * Returns the size of the stored data.
 */
const storeRevisionData = async (id: string, data: RevisionData) => {
  const offloaded = await offloadDataUrls(data);
  const json = JSON.stringify(offloaded);
  await putObject(getRevisionKey(id), json, "application/json");
  return Buffer.byteLength(json);
};

const readRevisionData = async (id: string) => {
  const json = await getObjectText(getRevisionKey(id));
  if (json === null) return null;
  return JSON.parse(json) as RevisionData;
};

/** Moves the data of a revision that is still in the database to object storage */
const migrateRevision = async (id: string) => {
  const revision = await prisma.revision.findUnique({ where: { id }, select: { data: true, size: true } });
  if (!revision || revision.size !== null || revision.data === null) return revision?.size ?? null;
  const size = await storeRevisionData(id, revision.data as unknown as RevisionData);
  await prisma.revision.update({ where: { id }, data: { data: Prisma.DbNull, size } });
  return size;
};

const findRevisionMetadata = async (id: string) => {
  return prisma.revision.findUnique({
    where: { id },
    select: {
      id: true,
      documentId: true,
      createdAt: true,
      size: true,
    },
  });
};

const findRevisionById = async (id: string) => {
  const revision = await findRevisionMetadata(id);
  if (!revision) return null;
  const { size, ...metadata } = revision;
  let data: RevisionData | null = null;
  if (size === null) {
    // not migrated yet
    const legacy = await prisma.revision.findUnique({ where: { id }, select: { data: true } });
    data = (legacy?.data ?? null) as unknown as RevisionData | null;
  } else {
    data = await readRevisionData(id);
  }
  if (!data) return null;
  const DocumentRevision: EditorDocumentRevision = { ...metadata, data };
  return DocumentRevision;
}

const getCachedRevision = unstable_cache(findRevisionById, [], { tags: ["revision"] });

/** The revision with a signed url that the client downloads its data from */
const findStoredRevision = async (id: string) => {
  const revision = await findRevisionMetadata(id);
  if (!revision) return null;
  const { size, ...metadata } = revision;
  if (size === null) await migrateRevision(id);
  const url = await getSignedDownloadUrl(getRevisionKey(id), REVISION_URL_EXPIRY);
  const storedRevision: StoredDocumentRevision = { ...metadata, url };
  return storedRevision;
};

const getRevisionDataUrl = async (id: string) => {
  const revision = await findStoredRevision(id);
  return revision?.url ?? null;
};

const findRevisionAuthorId = async (id: string) => {
  const revision = await prisma.revision.findUnique({
    where: { id },
    select: {
      authorId: true,
    }
  });
  return revision?.authorId;
}

const revisionExists = async (id: string) => {
  const count = await prisma.revision.count({ where: { id } });
  return count > 0;
};

type RevisionInput = Omit<Prisma.RevisionUncheckedCreateInput, "data" | "size"> & { id: string };

/** Stores the data of a new revision, the result is used to create the revision in the database */
const prepareRevision = async <T extends { id: string }>(input: T, data: RevisionData) => {
  const size = await storeRevisionData(input.id, data);
  return { ...input, size };
};

const createRevision = async (input: RevisionInput, data: RevisionData) => {
  return prisma.revision.create({ data: await prepareRevision(input, data) });
}

const deleteRevision = async (id: string) => {
  const revision = await prisma.revision.delete({
    where: { id },
  });
  await deleteRevisionData([id]);
  return revision;
}

const deleteRevisionData = async (ids: string[]) => {
  try {
    await deleteObjects(ids.map(getRevisionKey));
  } catch (error) {
    console.error("failed to delete revision data", error);
  }
};

export {
  getCachedRevision,
  findStoredRevision,
  getRevisionDataUrl,
  findRevisionAuthorId,
  revisionExists,
  prepareRevision,
  createRevision,
  deleteRevision,
  deleteRevisionData,
  migrateRevision,
  storeRevisionData,
  readRevisionData,
};
