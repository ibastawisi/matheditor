import { createHash } from "crypto";
import { getObject, getSignedDownloadUrl, IMAGE_URL_EXPIRY, objectExists, putObject } from "@/lib/storage";
import {
  getDataUrlMimeType,
  getImageExtension,
  getImageKey,
  getImageMimeType,
  getStoredImageSrc,
  isDataUrl,
  isStoredImageSrc,
  isStoredSvgSrc,
  transformImageSources,
} from "@/shared/storage";

/** Decodes a data url into its bytes */
export const decodeDataUrl = (src: string) => {
  const comma = src.indexOf(",");
  const header = src.slice(5, comma);
  const payload = src.slice(comma + 1);
  const mimeType = getDataUrlMimeType(src) || "application/octet-stream";
  const isBase64 = header.split(";").includes("base64");
  const bytes = isBase64 ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload), "utf8");
  return { mimeType, bytes };
};

/**
 * Stores an image under a name derived from its content,
 * so the same image is only stored once, however many documents use it
 */
export const storeImage = async (bytes: Uint8Array, mimeType: string) => {
  const hash = createHash("sha256").update(bytes).digest("hex");
  const src = getStoredImageSrc(`${hash}.${getImageExtension(mimeType)}`);
  const key = getImageKey(src);
  if (!(await objectExists(key))) await putObject(key, bytes, mimeType);
  return src;
};

export const storeDataUrl = async (src: string) => {
  const { mimeType, bytes } = decodeDataUrl(src);
  return storeImage(bytes, mimeType);
};

/** Moves the data urls of a serialized editor state to storage, replacing them with stored image sources */
export const offloadDataUrls = <T,>(data: T) => transformImageSources(data, isDataUrl, storeDataUrl);

export const readStoredImageAsDataUrl = async (src: string) => {
  const object = await getObject(getImageKey(src));
  if (!object) return null;
  const mimeType = object.contentType || getImageMimeType(src);
  if (mimeType === "image/svg+xml") {
    return `data:image/svg+xml,${encodeURIComponent(new TextDecoder().decode(object.body))}`;
  }
  return `data:${mimeType};base64,${Buffer.from(object.body).toString("base64")}`;
};

/**
 * Brings stored images back into a serialized editor state as data urls, for exports that need
 * their content. By default only svgs are inlined, as they are rendered as inline elements.
 */
export const inlineStoredImages = <T,>(data: T, { svgOnly = true }: { svgOnly?: boolean } = {}) =>
  transformImageSources(data, svgOnly ? isStoredSvgSrc : isStoredImageSrc, async (src) => {
    try {
      return await readStoredImageAsDataUrl(src);
    } catch (error) {
      console.error(`failed to read stored image ${src}`, error);
      return null;
    }
  });

/**
 * Prepares a serialized editor state for server HTML export:
 * inlines stored SVGs (so they render as inline <svg> elements) and
 * signs raster stored images (so <img> elements load from storage).
 */
export const resolveStoredImagesForHtml = <T,>(data: T) =>
  transformImageSources(data, isStoredImageSrc, async (src) => {
    try {
      if (isStoredSvgSrc(src)) return await readStoredImageAsDataUrl(src);
      return await getSignedDownloadUrl(getImageKey(src), IMAGE_URL_EXPIRY);
    } catch (error) {
      console.error(`failed to resolve stored image ${src}`, error);
      return null;
    }
  });
