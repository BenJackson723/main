import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const [deal] = await sql`
      SELECT d.*, c.name AS contact_name, c.company AS contact_company, c.email AS contact_email, c.phone AS contact_phone
      FROM crm_deals d
      LEFT JOIN crm_contacts c ON c.id = d.contact_id
      WHERE d.id = ${id}
    `
    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const activities = await sql`
      SELECT * FROM crm_activities WHERE deal_id=${id} ORDER BY created_at DESC
    `
    return NextResponse.json({ ...deal, activities })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { title, contact_id, stage, value, leads_count, package_name, assigned_to, notes } = body
    const [deal] = await sql`
      UPDATE crm_deals
      SET title=${title}, contact_id=${contact_id ?? null}, stage=${stage},
          value=${value ?? 0}, leads_count=${leads_count ?? 0},
          package_name=${package_name ?? null}, assigned_to=${assigned_to ?? null},
          notes=${notes ?? null}, updated_at=NOW()
      WHERE id=${id}
      RETURNING *
    `
    return NextResponse.json(deal)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await sql`DELETE FROM crm_deals WHERE id=${id}`
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
