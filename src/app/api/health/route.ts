import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()
  try {
    const rows = await sql`SELECT 1 AS ok, NOW() AS ts`
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      ts: rows[0].ts,
      latency_ms: Date.now() - start,
      database_url_set: !!process.env.DATABASE_URL,
      database_url_prefix: process.env.DATABASE_URL?.slice(0, 40) + '…',
    })
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      db: 'failed',
      error: err?.message,
      code: err?.code,
      latency_ms: Date.now() - start,
      database_url_set: !!process.env.DATABASE_URL,
      database_url_prefix: process.env.DATABASE_URL?.slice(0, 40) + '…',
    }, { status: 500 })
  }
}
