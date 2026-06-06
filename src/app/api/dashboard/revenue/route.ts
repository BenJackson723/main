import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const start90d = new Date(Date.now() - 90 * 86400000).toISOString()

    const [creditTx, purchases, unlocks, subscriptions, plans] = await Promise.all([
      supabase
        .from('credit_transactions')
        .select('amount, type, created_at, user_id')
        .gte('created_at', start90d)
        .order('created_at', { ascending: true }),
      supabase
        .from('lead_purchases')
        .select('*')
        .gte('created_at', start90d)
        .order('created_at', { ascending: true }),
      supabase
        .from('lead_unlocks')
        .select('*')
        .gte('created_at', start90d)
        .order('created_at', { ascending: true }),
      supabase
        .from('agent_subscriptions')
        .select('status, plan_id, created_at, cancelled_at')
        .order('created_at', { ascending: true }),
      supabase
        .from('subscription_plans')
        .select('id, name, price_cents, interval'),
    ])

    // Build daily credit volume over 90d
    const dailyCredits: Record<string, { debits: number; credits: number }> = {}
    for (let i = 89; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      dailyCredits[d] = { debits: 0, credits: 0 }
    }
    for (const tx of creditTx.data ?? []) {
      const day = (tx.created_at as string).slice(0, 10)
      if (!(day in dailyCredits)) continue
      if ((tx.amount ?? 0) < 0) dailyCredits[day].debits += Math.abs(tx.amount)
      else dailyCredits[day].credits += tx.amount
    }
    const creditTimeSeries = Object.entries(dailyCredits).map(([date, v]) => ({ date, ...v }))

    // Transaction type breakdown
    const typeCounts: Record<string, number> = {}
    for (const tx of creditTx.data ?? []) {
      const k = tx.type ?? 'unknown'
      typeCounts[k] = (typeCounts[k] ?? 0) + 1
    }

    // Plan MRR estimate
    const planMap: Record<string, { name: string; price_cents: number }> = {}
    for (const p of plans.data ?? []) planMap[p.id] = { name: p.name, price_cents: p.price_cents ?? 0 }

    const activeSubs = (subscriptions.data ?? []).filter(s => s.status === 'active')
    const mrrByCents = activeSubs.reduce((sum, s) => sum + (planMap[s.plan_id]?.price_cents ?? 0), 0)
    const mrr = mrrByCents / 100

    return NextResponse.json({
      creditTimeSeries,
      transactionTypes: Object.entries(typeCounts).map(([type, count]) => ({ type, count })),
      mrr,
      totalPurchases: purchases.data?.length ?? 0,
      totalUnlocks: unlocks.data?.length ?? 0,
      recentTransactions: (creditTx.data ?? []).slice(-50).reverse(),
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
  }
}
