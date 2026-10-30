import type { GetImageSignedUrlResponse, PostImageUploadResponse } from "@/types";
import { cacheInlineSvg } from "@/editor/extensions/image/utils";
import type { Services } from "./types";

const signedUrlPromises = new Map<string, Promise<string>>();

const hashFile = async (file: File): Promise<string | undefined> => {
  if (typeof crypto === "undefined" || !crypto.subtle) return undefined;
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
};

export const defaultServices: Services = {
  uploadImage: async (file: File) => {
    try {
      const contentType = file.type || "application/octet-stream";
      const [hash, svgText] = await Promise.all([
        hashFile(file),
        contentType === "image/svg+xml" ? file.text() : Promise.resolve(null),
      ]);
      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash, contentType }),
      });
      const { data, error } = (await response.json()) as PostImageUploadResponse;
      if (!response.ok || error || !data) {
        return { error: error ?? new Error("Uploading image failed"), data: null };
      }
      if (data.uploadUrl) {
        const uploadResponse = await fetch(data.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: file,
        });
        if (!uploadResponse.ok) {
          return { error: new Error("Uploading image failed"), data: null };
        }
      }
      signedUrlPromises.set(data.path, Promise.resolve(data.signedUrl));
      if (svgText !== null) {
        cacheInlineSvg(data.fullPath, svgText);
      }
      return {
        error: null,
        data: {
          id: data.id,
          path: data.path,
          fullPath: data.fullPath,
        },
      };
    } catch (error) {
      return { error, data: null };
    }
  },
  getImageSignedUrl: async (path: string) => {
    const fileName = path.split("/").pop()!;
    try {
      let promise = signedUrlPromises.get(fileName);
      if (!promise) {
        promise = fetch(`/api/images/${encodeURIComponent(fileName)}`).then(async (response) => {
          const { data, error } = (await response.json()) as GetImageSignedUrlResponse;
          if (!response.ok || error || !data) {
            throw error ?? new Error("Getting image signed url failed");
          }
          return data.signedUrl;
        });
        signedUrlPromises.set(fileName, promise);
      }
      const signedUrl = await promise;
      return { error: null, data: { signedUrl } };
    } catch (error) {
      signedUrlPromises.delete(fileName);
      return { error, data: null };
    }
  },
};
