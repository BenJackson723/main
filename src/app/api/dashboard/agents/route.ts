import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const [subscriptions, plans, referrals, bonusGrants, cycleHistory] = await Promise.all([
      supabase
        .from('agent_subscriptions')
        .select('id, user_id, plan_id, status, cycle_allocation, cycle_used, rollover_from_previous, current_cycle_start, current_cycle_end, created_at, cancelled_at, cancel_at_period_end')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('subscription_plans')
        .select('id, name, price_cents, interval, lead_allocation'),
      supabase
        .from('agent_referrals')
        .select('status, created_at, converted_at')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('bonus_unlock_grants')
        .select('original_amount, remaining, reason, created_at, expires_at, revoked_at')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('subscription_cycle_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
    ])

    // Plan breakdown
    const planMap: Record<string, string> = {}
    for (const p of plans.data ?? []) planMap[p.id] = p.name

    const planBreakdown: Record<string, number> = {}
    for (const sub of subscriptions.data ?? []) {
      if (sub.status === 'active') {
        const name = planMap[sub.plan_id] ?? 'Unknown'
        planBreakdown[name] = (planBreakdown[name] ?? 0) + 1
      }
    }

    // Status breakdown
    const statusBreakdown: Record<string, number> = {}
    for (const sub of subscriptions.data ?? []) {
      statusBreakdown[sub.status] = (statusBreakdown[sub.status] ?? 0) + 1
    }

    // Referral stats
    const referralStats = { pending: 0, joined: 0, converted: 0 }
    for (const r of referrals.data ?? []) {
      if (r.status === 'pending') referralStats.pending++
      else if (r.status === 'joined') referralStats.joined++
      else if (r.status === 'converted') referralStats.converted++
    }

    // Usage stats — who is near their limit
    const nearLimit = (subscriptions.data ?? [])
      .filter(s => s.status === 'active' && s.cycle_allocation > 0)
      .map(s => ({
        user_id: s.user_id,
        used: s.cycle_used,
        allocation: s.cycle_allocation,
        pct: Math.round((s.cycle_used / s.cycle_allocation) * 100),
      }))
      .filter(s => s.pct >= 80)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 20)

    return NextResponse.json({
      subscriptions: subscriptions.data ?? [],
      plans: plans.data ?? [],
      planBreakdown: Object.entries(planBreakdown).map(([name, count]) => ({ name, count })),
      statusBreakdown: Object.entries(statusBreakdown).map(([status, count]) => ({ status, count })),
      referralStats,
      bonusGrants: bonusGrants.data ?? [],
      nearLimit,
      cycleHistory: cycleHistory.data ?? [],
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch agents data' }, { status: 500 })
  }
}
