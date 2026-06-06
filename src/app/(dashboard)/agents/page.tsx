export const dynamic = 'force-dynamic'
import sql from '@/lib/db'
import AgentsClient from './AgentsClient'

export default async function AgentsPage() {
  let data: any = null
  try {
    const [subscriptions, planBreakdown, statusBreakdown, referralStats, bonusGrants, nearLimit] = await Promise.all([
      sql`
        SELECT s.id, s.user_id, s.plan_id, s.status, s.cycle_allocation, s.cycle_used,
               s.current_cycle_start, s.current_cycle_end, s.created_at, s.cancelled_at,
               s.cancel_at_period_end, p.name as plan_name
        FROM agent_subscriptions s
        LEFT JOIN subscription_plans p ON p.id = s.plan_id
        ORDER BY s.created_at DESC LIMIT 200
      `,
      sql`
        SELECT COALESCE(p.name, 'Unknown') as name, COUNT(*)::int as count
        FROM agent_subscriptions s
        LEFT JOIN subscription_plans p ON p.id = s.plan_id
        WHERE s.status = 'active'
        GROUP BY p.name ORDER BY count DESC
      `,
      sql`SELECT status, COUNT(*)::int as count FROM agent_subscriptions GROUP BY status ORDER BY count DESC`,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
          COUNT(*) FILTER (WHERE status = 'joined')::int as joined,
          COUNT(*) FILTER (WHERE status = 'converted')::int as converted
        FROM agent_referrals
      `,
      sql`SELECT original_amount, remaining, reason, created_at, expires_at FROM bonus_unlock_grants ORDER BY created_at DESC LIMIT 20`,
      sql`
        SELECT user_id, cycle_used, cycle_allocation,
               ROUND((cycle_used::numeric / NULLIF(cycle_allocation,0)) * 100)::int as pct
        FROM agent_subscriptions
        WHERE status = 'active' AND cycle_allocation > 0
          AND (cycle_used::numeric / NULLIF(cycle_allocation,0)) >= 0.8
        ORDER BY pct DESC LIMIT 20
      `,
    ])
    data = { subscriptions, planBreakdown, statusBreakdown, referralStats: referralStats[0], bonusGrants, nearLimit }
  } catch (err: any) {
    data = { error: err?.message }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Agent Management</h1>
        <p className="text-gray-400 text-sm mt-1">Subscriptions, usage, referrals, bonuses</p>
      </div>
      <AgentsClient data={data} />
    </div>
  )
}
