import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const [contact] = await sql`SELECT * FROM crm_contacts WHERE id = ${id}`
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const deals = await sql`SELECT * FROM crm_deals WHERE contact_id = ${id} ORDER BY created_at DESC`
    const activities = await sql`SELECT * FROM crm_activities WHERE contact_id = ${id} ORDER BY created_at DESC LIMIT 20`
    return NextResponse.json({ ...contact, deals, activities })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { name, company, email, phone, current_package, notes } = body
    const [contact] = await sql`
      UPDATE crm_contacts
      SET name=${name}, company=${company ?? null}, email=${email ?? null},
          phone=${phone ?? null}, current_package=${current_package ?? null}, notes=${notes ?? null}
      WHERE id=${id}
      RETURNING *
    `
    return NextResponse.json(contact)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await sql`DELETE FROM crm_contacts WHERE id=${id}`
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
