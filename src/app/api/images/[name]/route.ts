import { NextResponse } from "next/server";
import { getSignedDownloadUrl, IMAGE_URL_EXPIRY } from "@/lib/storage";
import { getImageKey, getStoredImageSrc, isStoredImageSrc } from "@/shared/storage";
import { GetImageSignedUrlResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, props: { params: Promise<{ name: string }> }) {
  const params = await props.params;
  const response: GetImageSignedUrlResponse = {};
  try {
    const src = getStoredImageSrc(params.name);
    if (!isStoredImageSrc(src)) {
      response.error = { title: "Bad Request", subtitle: "Invalid image path" };
      return NextResponse.json(response, { status: 400 });
    }
    const signedUrl = await getSignedDownloadUrl(getImageKey(src), IMAGE_URL_EXPIRY);
    response.data = { signedUrl };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error(error);
    response.error = { title: "Something went wrong", subtitle: "Please try again later" };
    return NextResponse.json(response, { status: 500 });
  }
}
