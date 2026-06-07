import { headers } from 'next/headers'
import PipelineClient from './PipelineClient'
import sql from '@/lib/db'

async function ensureTables() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS crm_contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT,
        email TEXT,
        phone TEXT,
        current_package TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS crm_deals (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        contact_id INTEGER REFERENCES crm_contacts(id) ON DELETE SET NULL,
        stage TEXT NOT NULL DEFAULT 'prospecting',
        value NUMERIC(12,2) DEFAULT 0,
        leads_count INTEGER DEFAULT 0,
        package_name TEXT,
        assigned_to TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS crm_activities (
        id SERIAL PRIMARY KEY,
        deal_id INTEGER REFERENCES crm_deals(id) ON DELETE CASCADE,
        contact_id INTEGER REFERENCES crm_contacts(id) ON DELETE CASCADE,
        type TEXT NOT NULL DEFAULT 'note',
        content TEXT NOT NULL,
        created_by TEXT DEFAULT 'Team',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
  } catch {
    // tables already exist or DB not available
  }
}

export default async function CRMPage() {
  await ensureTables()
  return <PipelineClient />
}
