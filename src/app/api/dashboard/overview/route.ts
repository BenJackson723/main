import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const start7d = new Date(Date.now() - 7 * 86400000).toISOString()
    const start30d = new Date(Date.now() - 30 * 86400000).toISOString()

    const [
      totalLeads,
      leadsThisMonth,
      leadsLastMonth,
      leadsToday,
      totalUsers,
      newUsersThisMonth,
      activeSubscriptions,
      cancelledThisMonth,
      totalPurchases,
      purchasesThisMonth,
      totalUnlocks,
      unlocksThisMonth,
      creditsTxThisMonth,
      assignmentsThisMonth,
      funnelSubmissionsThisMonth,
      leadsLast30d,
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', startOfLastMonth).lt('created_at', startOfMonth),
      supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      supabase.from('agent_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('agent_subscriptions').select('*', { count: 'exact', head: true }).not('cancelled_at', 'is', null).gte('cancelled_at', startOfMonth),
      supabase.from('lead_purchases').select('*', { count: 'exact', head: true }),
      supabase.from('lead_purchases').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      supabase.from('lead_unlocks').select('*', { count: 'exact', head: true }),
      supabase.from('lead_unlocks').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      supabase.from('credit_transactions').select('amount').gte('created_at', startOfMonth),
      supabase.from('lead_assignments').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      supabase.from('funnel_submissions').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      supabase.from('leads').select('created_at').gte('created_at', start30d).order('created_at'),
    ])

    // Credit volume this month
    const creditVolume = (creditsTxThisMonth.data ?? []).reduce((sum, tx) => sum + Math.abs(tx.amount ?? 0), 0)

    // Leads per day last 30d
    const leadsByDay: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      leadsByDay[d.toISOString().slice(0, 10)] = 0
    }
    for (const lead of leadsLast30d.data ?? []) {
      const day = (lead.created_at as string).slice(0, 10)
      if (day in leadsByDay) leadsByDay[day]++
    }
    const leadsTimeSeries = Object.entries(leadsByDay).map(([date, count]) => ({ date, count }))

    const leadsGrowth = leadsLastMonth.count
      ? Math.round(((leadsThisMonth.count! - leadsLastMonth.count) / leadsLastMonth.count) * 100)
      : null

    return NextResponse.json({
      leads: {
        total: totalLeads.count,
        thisMonth: leadsThisMonth.count,
        lastMonth: leadsLastMonth.count,
        today: leadsToday.count,
        growthPct: leadsGrowth,
        timeSeries: leadsTimeSeries,
      },
      users: {
        total: totalUsers.count,
        newThisMonth: newUsersThisMonth.count,
      },
      subscriptions: {
        active: activeSubscriptions.count,
        cancelledThisMonth: cancelledThisMonth.count,
      },
      transactions: {
        totalPurchases: totalPurchases.count,
        purchasesThisMonth: purchasesThisMonth.count,
        totalUnlocks: totalUnlocks.count,
        unlocksThisMonth: unlocksThisMonth.count,
        creditVolumeThisMonth: creditVolume,
      },
      assignments: {
        thisMonth: assignmentsThisMonth.count,
      },
      funnels: {
        submissionsThisMonth: funnelSubmissionsThisMonth.count,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 })
  }
}
