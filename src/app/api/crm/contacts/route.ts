import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  try {
    const contacts = await sql`
      SELECT c.*, COUNT(d.id)::int AS deal_count
      FROM crm_contacts c
      LEFT JOIN crm_deals d ON d.contact_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `
    return NextResponse.json(contacts)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, company, email, phone, current_package, notes } = body
    const [contact] = await sql`
      INSERT INTO crm_contacts (name, company, email, phone, current_package, notes)
      VALUES (${name}, ${company ?? null}, ${email ?? null}, ${phone ?? null}, ${current_package ?? null}, ${notes ?? null})
      RETURNING *
    `
    return NextResponse.json(contact)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
