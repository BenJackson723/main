import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { deal_id, contact_id, type, content, created_by } = body
    const [activity] = await sql`
      INSERT INTO crm_activities (deal_id, contact_id, type, content, created_by)
      VALUES (${deal_id ?? null}, ${contact_id ?? null}, ${type ?? 'note'}, ${content}, ${created_by ?? 'Team'})
      RETURNING *
    `
    return NextResponse.json(activity)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
