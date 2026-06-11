export const dynamic = 'force-dynamic'
import sql from '@/lib/db'
import LeadsClient from './LeadsClient'

export default async function LeadsPage() {
  let data: any = null
  try {
    const start30d = new Date(Date.now() - 30 * 86400000)
    const [recentLeads, dealStages, contactOutcomes, auditLog] = await Promise.all([
      sql`SELECT id, created_at, funnel_status AS status, property_budget, property_purpose, profile_data FROM leads ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT to_stage AS stage, COUNT(*)::int as count FROM deal_stage_history WHERE created_at >= ${start30d} GROUP BY to_stage ORDER BY count DESC`,
      sql`SELECT outcome, COUNT(*)::int as count FROM contact_attempts WHERE created_at >= ${start30d} GROUP BY outcome ORDER BY count DESC`,
      sql`SELECT field_name AS action, changed_at AS created_at, changed_by AS actor_id FROM lead_audit_log ORDER BY changed_at DESC LIMIT 30`,
    ])
    data = { recentLeads, dealStages, contactOutcomes, auditLog }
  } catch (err: any) {
    data = { error: err?.message }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Lead Analysis</h1>
        <p className="text-gray-400 text-sm mt-1">Pipeline, conversions, funnel performance</p>
      </div>
      <LeadsClient data={data} />
    </div>
  )
}
