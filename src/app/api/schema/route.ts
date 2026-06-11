import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

const TABLES = [
  'leads', 'users', 'agent_subscriptions', 'subscription_plans',
  'lead_purchases', 'lead_unlocks', 'credit_transactions',
  'lead_assignments', 'funnel_submissions', 'campaign_messages',
  'campaign_message_sends', 'lead_sequence_enrollments', 'notification_queue',
  'marketplace_listings', 'assignment_events', 'deal_stage_history',
  'contact_attempts', 'lead_audit_log', 'user_audit_events',
  'user_notifications', 'onboarding_surveys', 'agent_referrals',
  'bonus_unlock_grants',
]

export async function GET() {
  try {
    const rows = await sql`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY(${TABLES})
      ORDER BY table_name, ordinal_position
    `

    const schema: Record<string, string[]> = {}
    for (const row of rows) {
      if (!schema[row.table_name]) schema[row.table_name] = []
      schema[row.table_name].push(`${row.column_name} (${row.data_type})`)
    }

    const missing = TABLES.filter(t => !schema[t])

    return NextResponse.json({ schema, missing_tables: missing })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message, code: err?.code }, { status: 500 })
  }
}
