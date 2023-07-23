import { findAllDocuments } from '@/app/repositories/document'
import { NextResponse } from 'next/server'
 
export async function GET(request: Request) {
  try {
    const data = await findAllDocuments()
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.error()
  }
}