export const dynamic = 'force-dynamic'
import sql from '@/lib/db'
import RevenueClient from './RevenueClient'

async function getStripe() {
  try {
    const res = await fetch('https://main-lake-nine.vercel.app/api/dashboard/stripe', { cache: 'no-store' })
    return res.ok ? res.json() : { error: 'unavailable' }
  } catch { return { error: 'unavailable' } }
}

export default async function RevenuePage() {
  let supabase: any = null
  try {
    const start90d = new Date(Date.now() - 90 * 86400000)
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const startOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)

    const [dailyCredits, transactionTypes, mrrData, purchasesCount, unlocksCount, revenueThisMonth, revenueLastMonth, recentTransactions] = await Promise.all([
      sql`
        SELECT created_at::date as day,
          COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0)::numeric as credits,
          COALESCE(SUM(ABS(amount)) FILTER (WHERE amount < 0), 0)::numeric as debits
        FROM credit_transactions WHERE created_at >= ${start90d}
        GROUP BY day ORDER BY day
      `,
      sql`SELECT type, COUNT(*)::int as count FROM credit_transactions WHERE created_at >= ${start90d} GROUP BY type ORDER BY count DESC`,
      sql`SELECT COALESCE(SUM(p.price_cents), 0)::int as total_cents FROM agent_subscriptions s JOIN subscription_plans p ON p.id = s.plan_id WHERE s.status = 'active'`,
      sql`SELECT COUNT(*)::int FROM lead_purchases WHERE created_at >= ${start90d}`,
      sql`SELECT COUNT(*)::int FROM lead_unlocks WHERE created_at >= ${start90d}`,
      sql`SELECT COALESCE(SUM(ABS(amount)), 0)::int as total FROM credit_transactions WHERE created_at >= ${startOfMonth} AND amount < 0`,
      sql`SELECT COALESCE(SUM(ABS(amount)), 0)::int as total FROM credit_transactions WHERE created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth} AND amount < 0`,
      sql`SELECT amount, type, created_at, user_id FROM credit_transactions WHERE created_at >= ${start90d} ORDER BY created_at DESC LIMIT 50`,
    ])

    const byDay: Record<string, any> = {}
    for (let i = 89; i >= 0; i--) {
      byDay[new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)] = { credits: 0, debits: 0 }
    }
    for (const r of dailyCredits) {
      const d = String(r.day).slice(0, 10)
      if (d in byDay) byDay[d] = { credits: Number(r.credits), debits: Number(r.debits) }
    }

    const thisM = revenueThisMonth[0].total
    const lastM = revenueLastMonth[0].total
    supabase = {
      creditTimeSeries: Object.entries(byDay).map(([date, v]) => ({ date, ...v })),
      transactionTypes,
      mrr: mrrData[0].total_cents / 100,
      revenueThisMonth: thisM,
      revenueLastMonth: lastM,
      revenueGrowthPct: lastM > 0 ? Math.round(((thisM - lastM) / lastM) * 100) : null,
      totalPurchases: purchasesCount[0].count,
      totalUnlocks: unlocksCount[0].count,
      recentTransactions,
    }
  } catch (err: any) {
    supabase = { error: err?.message }
  }

  const stripe = await getStripe()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue</h1>
        <p className="text-gray-400 text-sm mt-1">Stripe payments, MRR, credits, payouts, disputes</p>
      </div>
      <RevenueClient supabase={supabase} stripe={stripe} />
    </div>
  )
}
