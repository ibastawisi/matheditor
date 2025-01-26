import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: { title: "Unauthenticated", subtitle: "Please sign in to revalidate cache" } }, { status: 401 })
  }
  const { user } = session;
  if (user.role !== "admin") {
    return NextResponse.json({ error: { title: "Unauthorized", subtitle: "You are not authorized to revalidate cache" } }, { status: 403 })
  }

  const path = request.nextUrl.searchParams.get('path');
  if (path) {
    revalidatePath(path)
    return Response.json({ revalidated: path, now: Date.now() })
  }

  const tag = request.nextUrl.searchParams.get('tag');
  if (tag) {
    revalidateTag(tag)
    return Response.json({ revalidated: tag, now: Date.now() })
  }

  return Response.json({
    revalidated: false,
    now: Date.now(),
    message: 'Missing path or tag to revalidate',
  })
}