import { findAllUsers } from '@/app/repositories/user'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const data = await findAllUsers()
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.error()
  }
}