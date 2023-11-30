import { NextResponse } from "next/server";
import { revalidatePath } from 'next/cache';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url.replace(process.env.PUBLIC_URL!, process.env.PDF_WORKER_URL!));
    const searchParams = new URLSearchParams(url.search);
    const revalidiate = searchParams.get('revalidate');
    if (revalidiate) {
      searchParams.delete('revalidate');
      url.search = searchParams.toString();
      revalidatePath(url.toString());
    }
    const response = await fetch(url.toString(), { cache: 'force-cache' });
    return response;
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

