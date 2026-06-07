import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  try {
    const deals = await sql`
      SELECT d.*, c.name AS contact_name, c.company AS contact_company
      FROM crm_deals d
      LEFT JOIN crm_contacts c ON c.id = d.contact_id
      ORDER BY d.updated_at DESC
    `
    return NextResponse.json(deals)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, contact_id, stage, value, leads_count, package_name, assigned_to, notes } = body
    const [deal] = await sql`
      INSERT INTO crm_deals (title, contact_id, stage, value, leads_count, package_name, assigned_to, notes)
      VALUES (
        ${title}, ${contact_id ?? null}, ${stage ?? 'prospecting'},
        ${value ?? 0}, ${leads_count ?? 0}, ${package_name ?? null},
        ${assigned_to ?? null}, ${notes ?? null}
      )
      RETURNING *
    `
    return NextResponse.json(deal)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
