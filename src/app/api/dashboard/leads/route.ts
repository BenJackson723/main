import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  try {
    const start30d = new Date(Date.now() - 30 * 86400000)

    const [recentLeads, dealStages, contactOutcomes, auditLog, funnelSubmissions] = await Promise.all([
      sql`
        SELECT id, created_at, status, suburb, state, property_type,
               budget_min, budget_max, bedrooms
        FROM leads
        ORDER BY created_at DESC
        LIMIT 50
      `,
      sql`
        SELECT stage, COUNT(*) as count
        FROM deal_stage_history
        WHERE created_at >= ${start30d}
        GROUP BY stage
        ORDER BY count DESC
      `,
      sql`
        SELECT outcome, COUNT(*) as count
        FROM contact_attempts
        WHERE created_at >= ${start30d}
        GROUP BY outcome
        ORDER BY count DESC
      `,
      sql`
        SELECT action, created_at, actor_id
        FROM lead_audit_log
        ORDER BY created_at DESC
        LIMIT 30
      `,
      sql`
        SELECT funnel_id, COUNT(*) as count
        FROM funnel_submissions
        WHERE created_at >= ${start30d}
        GROUP BY funnel_id
        ORDER BY count DESC
      `,
    ])

    return NextResponse.json({
      recentLeads,
      dealStages,
      contactOutcomes,
      auditLog,
      funnelSubmissions,
    })
  } catch (err: any) {
    console.error('Leads error:', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
