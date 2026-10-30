/**
 * Conventions shared by the server and the client for files kept in object storage.
 *
 * Documents reference stored images by a stable src, like `/images/<name>`, which is
 * resolved to a short lived signed url when it is displayed.
 */

export const STORED_IMAGE_PREFIX = "/images/";

const STORED_IMAGE_NAME_REGEX = /^[A-Za-z0-9_-]+\.[a-z0-9]+$/;

const MIME_EXTENSIONS: Record<string, string> = {
  "image/svg+xml": "svg",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/tiff": "tiff",
};

export const isDataUrl = (src: unknown): src is string => typeof src === "string" && src.startsWith("data:image/");

export const isStoredImageSrc = (src: unknown): src is string =>
  typeof src === "string" &&
  src.startsWith(STORED_IMAGE_PREFIX) &&
  STORED_IMAGE_NAME_REGEX.test(src.slice(STORED_IMAGE_PREFIX.length));

export const isStoredSvgSrc = (src: unknown): src is string => isStoredImageSrc(src) && src.endsWith(".svg");

export const getStoredImageSrc = (name: string) => `${STORED_IMAGE_PREFIX}${name}`;

/** The object key of a stored image src */
export const getImageKey = (src: string) => `images/${src.slice(STORED_IMAGE_PREFIX.length)}`;

/** The object key of the data of a revision */
export const getRevisionKey = (id: string) => `revisions/${id}.json`;

/** The object key of the shared Yjs state of a document */
export const getCollabKey = (id: string) => `collab/${id}.bin`;

export const getImageExtension = (mimeType: string) => {
  const type = mimeType.toLowerCase();
  if (MIME_EXTENSIONS[type]) return MIME_EXTENSIONS[type];
  const subtype = type.split("/")[1] ?? "";
  return subtype.split("+")[0].replace(/[^a-z0-9]/g, "") || "bin";
};

export const getImageMimeType = (src: string) => {
  const extension = src.split(".").pop()?.toLowerCase();
  const entry = Object.entries(MIME_EXTENSIONS).find(([, ext]) => ext === extension);
  return entry ? entry[0] : "application/octet-stream";
};

export const getDataUrlMimeType = (src: string) => src.slice(5, src.indexOf(",")).split(";")[0];

type JsonValue = unknown;

/** Calls the callback for the src of every node in a serialized editor state, nested states included */
export const forEachImageSource = (value: JsonValue, callback: (src: string) => void) => {
  if (Array.isArray(value)) {
    for (const item of value) forEachImageSource(item, callback);
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  if (typeof record.type === "string" && typeof record.src === "string") callback(record.src);
  for (const key in record) {
    const child = record[key];
    if (child && typeof child === "object") forEachImageSource(child, callback);
  }
};

/** Returns a copy of a serialized editor state with the src of its nodes replaced */
export const replaceImageSources = <T,>(value: T, replacements: Map<string, string>): T => {
  if (!replacements.size) return value;
  const replace = (value: JsonValue): JsonValue => {
    if (Array.isArray(value)) return value.map(replace);
    if (!value || typeof value !== "object") return value;
    const record = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key in record) result[key] = replace(record[key]);
    if (typeof record.type === "string" && typeof record.src === "string") {
      const replacement = replacements.get(record.src);
      if (replacement !== undefined) result.src = replacement;
    }
    return result;
  };
  return replace(value) as T;
};

/** Collects the sources that match the filter and maps each of them to a replacement */
export const transformImageSources = async <T,>(
  value: T,
  filter: (src: string) => boolean,
  transform: (src: string) => Promise<string | null>,
  concurrency = 8
): Promise<T> => {
  const sources = new Set<string>();
  forEachImageSource(value, (src) => {
    if (filter(src)) sources.add(src);
  });
  const queue = [...sources];
  const replacements = new Map<string, string>();
  const worker = async () => {
    for (let src = queue.shift(); src !== undefined; src = queue.shift()) {
      const replacement = await transform(src);
      if (replacement !== null && replacement !== src) replacements.set(src, replacement);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
  return replaceImageSources(value, replacements);
};
