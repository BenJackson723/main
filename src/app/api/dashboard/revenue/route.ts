import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  try {
    const start90d = new Date(Date.now() - 90 * 86400000)
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const startOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)

    const [
      dailyCredits,
      transactionTypes,
      mrrData,
      purchasesCount,
      unlocksCount,
      revenueThisMonth,
      revenueLastMonth,
      recentTransactions,
    ] = await Promise.all([
      sql`
        SELECT
          created_at::date as day,
          COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0) as credits,
          COALESCE(SUM(ABS(amount)) FILTER (WHERE amount < 0), 0) as debits
        FROM credit_transactions
        WHERE created_at >= ${start90d}
        GROUP BY day
        ORDER BY day
      `,
      sql`
        SELECT type, COUNT(*) as count
        FROM credit_transactions
        WHERE created_at >= ${start90d}
        GROUP BY type
        ORDER BY count DESC
      `,
      sql`
        SELECT COALESCE(SUM(p.price_cents), 0) as total_cents
        FROM agent_subscriptions s
        JOIN subscription_plans p ON p.id = s.plan_id
        WHERE s.status = 'active'
      `,
      sql`SELECT COUNT(*) FROM lead_purchases WHERE created_at >= ${start90d}`,
      sql`SELECT COUNT(*) FROM lead_unlocks WHERE created_at >= ${start90d}`,
      sql`SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM credit_transactions WHERE created_at >= ${startOfMonth} AND amount < 0`,
      sql`SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM credit_transactions WHERE created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth} AND amount < 0`,
      sql`
        SELECT amount, type, created_at, user_id
        FROM credit_transactions
        WHERE created_at >= ${start90d}
        ORDER BY created_at DESC
        LIMIT 50
      `,
    ])

    // Zero-fill 90-day series
    const byDay: Record<string, { credits: number; debits: number }> = {}
    for (let i = 89; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      byDay[d] = { credits: 0, debits: 0 }
    }
    for (const row of dailyCredits) {
      const d = String(row.day).slice(0, 10)
      if (d in byDay) byDay[d] = { credits: Number(row.credits), debits: Number(row.debits) }
    }

    const mrr = Number(mrrData[0].total_cents) / 100
    const thisMonthRevenue = Number(revenueThisMonth[0].total)
    const lastMonthRevenue = Number(revenueLastMonth[0].total)
    const revenueGrowthPct = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : null

    return NextResponse.json({
      creditTimeSeries: Object.entries(byDay).map(([date, v]) => ({ date, ...v })),
      transactionTypes,
      mrr,
      revenueThisMonth: thisMonthRevenue,
      revenueLastMonth: lastMonthRevenue,
      revenueGrowthPct,
      totalPurchases: Number(purchasesCount[0].count),
      totalUnlocks: Number(unlocksCount[0].count),
      recentTransactions,
    })
  } catch (err: any) {
    console.error('Revenue error:', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
