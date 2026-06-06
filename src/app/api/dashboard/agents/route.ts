import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  try {
    const [
      subscriptions,
      plans,
      planBreakdown,
      statusBreakdown,
      referralStats,
      bonusGrants,
      nearLimit,
    ] = await Promise.all([
      sql`
        SELECT s.id, s.user_id, s.plan_id, s.status, s.cycle_allocation,
               s.cycle_used, s.rollover_from_previous, s.current_cycle_start,
               s.current_cycle_end, s.created_at, s.cancelled_at,
               s.cancel_at_period_end, p.name as plan_name
        FROM agent_subscriptions s
        LEFT JOIN subscription_plans p ON p.id = s.plan_id
        ORDER BY s.created_at DESC
        LIMIT 200
      `,
      sql`SELECT id, name, price_cents, interval, lead_allocation FROM subscription_plans`,
      sql`
        SELECT p.name, COUNT(*) as count
        FROM agent_subscriptions s
        LEFT JOIN subscription_plans p ON p.id = s.plan_id
        WHERE s.status = 'active'
        GROUP BY p.name
        ORDER BY count DESC
      `,
      sql`
        SELECT status, COUNT(*) as count
        FROM agent_subscriptions
        GROUP BY status
        ORDER BY count DESC
      `,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'joined') as joined,
          COUNT(*) FILTER (WHERE status = 'converted') as converted
        FROM agent_referrals
      `,
      sql`
        SELECT original_amount, remaining, reason, created_at, expires_at, revoked_at
        FROM bonus_unlock_grants
        ORDER BY created_at DESC
        LIMIT 50
      `,
      sql`
        SELECT user_id, cycle_used, cycle_allocation,
               ROUND((cycle_used::numeric / NULLIF(cycle_allocation, 0)) * 100) as pct
        FROM agent_subscriptions
        WHERE status = 'active' AND cycle_allocation > 0
          AND (cycle_used::numeric / NULLIF(cycle_allocation, 0)) >= 0.8
        ORDER BY pct DESC
        LIMIT 20
      `,
    ])

    return NextResponse.json({
      subscriptions,
      plans,
      planBreakdown,
      statusBreakdown,
      referralStats: referralStats[0],
      bonusGrants,
      nearLimit,
    })
  } catch (err: any) {
    console.error('Agents error:', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
