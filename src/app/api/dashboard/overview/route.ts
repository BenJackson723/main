import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const start30d = new Date(Date.now() - 30 * 86400000)

    const [
      totalLeads,
      leadsThisMonth,
      leadsLastMonth,
      leadsToday,
      totalUsers,
      newUsersThisMonth,
      activeSubscriptions,
      cancelledThisMonth,
      purchasesThisMonth,
      totalPurchases,
      unlocksThisMonth,
      totalUnlocks,
      creditVolumeThisMonth,
      assignmentsThisMonth,
      funnelSubmissionsThisMonth,
      leadsLast30d,
    ] = await Promise.all([
      sql`SELECT COUNT(*) FROM leads`,
      sql`SELECT COUNT(*) FROM leads WHERE created_at >= ${startOfMonth}`,
      sql`SELECT COUNT(*) FROM leads WHERE created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth}`,
      sql`SELECT COUNT(*) FROM leads WHERE created_at >= ${startOfToday}`,
      sql`SELECT COUNT(*) FROM users`,
      sql`SELECT COUNT(*) FROM users WHERE created_at >= ${startOfMonth}`,
      sql`SELECT COUNT(*) FROM agent_subscriptions WHERE status = 'active'`,
      sql`SELECT COUNT(*) FROM agent_subscriptions WHERE cancelled_at >= ${startOfMonth}`,
      sql`SELECT COUNT(*) FROM lead_purchases WHERE created_at >= ${startOfMonth}`,
      sql`SELECT COUNT(*) FROM lead_purchases`,
      sql`SELECT COUNT(*) FROM lead_unlocks WHERE created_at >= ${startOfMonth}`,
      sql`SELECT COUNT(*) FROM lead_unlocks`,
      sql`SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM credit_transactions WHERE created_at >= ${startOfMonth}`,
      sql`SELECT COUNT(*) FROM lead_assignments WHERE created_at >= ${startOfMonth}`,
      sql`SELECT COUNT(*) FROM funnel_submissions WHERE created_at >= ${startOfMonth}`,
      sql`SELECT created_at::date as day, COUNT(*) as count FROM leads WHERE created_at >= ${start30d} GROUP BY day ORDER BY day`,
    ])

    // Build 30-day time series with zero-fill
    const leadsByDay: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      leadsByDay[d] = 0
    }
    for (const row of leadsLast30d) {
      const day = String(row.day).slice(0, 10)
      if (day in leadsByDay) leadsByDay[day] = Number(row.count)
    }

    const thisMonthCount = Number(leadsThisMonth[0].count)
    const lastMonthCount = Number(leadsLastMonth[0].count)
    const growthPct = lastMonthCount > 0
      ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
      : null

    return NextResponse.json({
      leads: {
        total: Number(totalLeads[0].count),
        thisMonth: thisMonthCount,
        lastMonth: lastMonthCount,
        today: Number(leadsToday[0].count),
        growthPct,
        timeSeries: Object.entries(leadsByDay).map(([date, count]) => ({ date, count })),
      },
      users: {
        total: Number(totalUsers[0].count),
        newThisMonth: Number(newUsersThisMonth[0].count),
      },
      subscriptions: {
        active: Number(activeSubscriptions[0].count),
        cancelledThisMonth: Number(cancelledThisMonth[0].count),
      },
      transactions: {
        purchasesThisMonth: Number(purchasesThisMonth[0].count),
        totalPurchases: Number(totalPurchases[0].count),
        unlocksThisMonth: Number(unlocksThisMonth[0].count),
        totalUnlocks: Number(totalUnlocks[0].count),
        creditVolumeThisMonth: Number(creditVolumeThisMonth[0].total),
      },
      assignments: { thisMonth: Number(assignmentsThisMonth[0].count) },
      funnels: { submissionsThisMonth: Number(funnelSubmissionsThisMonth[0].count) },
    })
  } catch (err: any) {
    console.error('Overview error:', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
