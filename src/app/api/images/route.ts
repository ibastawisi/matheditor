import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSignedDownloadUrl, getSignedUploadUrl, IMAGE_URL_EXPIRY, objectExists } from "@/lib/storage";
import { getImageExtension, getImageKey, getStoredImageSrc } from "@/shared/storage";
import { PostImageUploadInput, PostImageUploadResponse } from "@/types";

export const dynamic = "force-dynamic";

const HASH_REGEX = /^[a-f0-9]{64}$/;

export async function POST(request: Request) {
  const response: PostImageUploadResponse = {};
  try {
    const body = (await request.json()) as PostImageUploadInput;
    if (!body?.contentType || !body.contentType.startsWith("image/")) {
      response.error = { title: "Bad Request", subtitle: "Unsupported image type" };
      return NextResponse.json(response, { status: 400 });
    }
    const id = body.hash && HASH_REGEX.test(body.hash) ? body.hash : randomUUID().replaceAll("-", "");
    const path = `${id}.${getImageExtension(body.contentType)}`;
    const fullPath = getStoredImageSrc(path);
    const key = getImageKey(fullPath);

    const [exists, signedUrl] = await Promise.all([
      objectExists(key),
      getSignedDownloadUrl(key, IMAGE_URL_EXPIRY),
    ]);
    const uploadUrl = exists ? undefined : await getSignedUploadUrl(key, body.contentType);

    response.data = {
      id,
      path,
      fullPath,
      signedUrl,
      uploadUrl,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error(error);
    response.error = { title: "Something went wrong", subtitle: "Please try again later" };
    return NextResponse.json(response, { status: 500 });
  }
}
