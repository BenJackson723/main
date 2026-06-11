export const dynamic = 'force-dynamic'
import sql from '@/lib/db'
import StatCard from '@/components/StatCard'
import OverviewCharts from './OverviewCharts'

async function getData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start30d = new Date(Date.now() - 30 * 86400000)

  const [statsRows, leadsLast30d] = await Promise.all([
    sql`
      WITH
        lead_counts AS (
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE created_at >= ${startOfMonth})::int AS this_month,
            COUNT(*) FILTER (WHERE created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth})::int AS last_month,
            COUNT(*) FILTER (WHERE created_at >= ${startOfToday})::int AS today
          FROM leads
        ),
        user_counts AS (
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE created_at >= ${startOfMonth})::int AS new_this_month
          FROM users
        ),
        sub_counts AS (
          SELECT
            COUNT(*) FILTER (WHERE status = 'active')::int AS active,
            COUNT(*) FILTER (WHERE cancelled_at >= ${startOfMonth})::int AS cancelled_this_month
          FROM agent_subscriptions
        ),
        purchase_counts AS (
          SELECT
            COUNT(*) FILTER (WHERE created_at >= ${startOfMonth})::int AS this_month,
            COUNT(*)::int AS total
          FROM lead_purchases
        ),
        unlock_counts AS (
          SELECT
            COUNT(*) FILTER (WHERE unlocked_at >= ${startOfMonth})::int AS this_month,
            COUNT(*)::int AS total
          FROM lead_unlocks
        ),
        credit_vol AS (
          SELECT COALESCE(SUM(ABS(amount)) FILTER (WHERE created_at >= ${startOfMonth}), 0)::int AS volume
          FROM credit_transactions
        ),
        assign_counts AS (
          SELECT COUNT(*) FILTER (WHERE created_at >= ${startOfMonth})::int AS this_month
          FROM lead_assignments
        ),
        funnel_counts AS (
          SELECT COUNT(*) FILTER (WHERE started_at >= ${startOfMonth})::int AS this_month
          FROM funnel_submissions
        )
      SELECT
        l.total AS leads_total, l.this_month AS leads_this_month, l.last_month AS leads_last_month, l.today AS leads_today,
        u.total AS users_total, u.new_this_month AS users_new_this_month,
        s.active AS subs_active, s.cancelled_this_month AS subs_cancelled,
        p.this_month AS purchases_this_month, p.total AS purchases_total,
        un.this_month AS unlocks_this_month, un.total AS unlocks_total,
        c.volume AS credit_volume,
        a.this_month AS assignments_this_month,
        f.this_month AS funnel_submissions
      FROM lead_counts l, user_counts u, sub_counts s, purchase_counts p, unlock_counts un, credit_vol c, assign_counts a, funnel_counts f
    `,
    sql`SELECT created_at::date as day, COUNT(*)::int as count FROM leads WHERE created_at >= ${start30d} GROUP BY day ORDER BY day`,
  ])

  const r = statsRows[0]
  const thisMonth = r.leads_this_month
  const lastMonth = r.leads_last_month
  const growthPct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null

  const byDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    byDay[new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)] = 0
  }
  for (const row of leadsLast30d) {
    const d = String(row.day).slice(0, 10)
    if (d in byDay) byDay[d] = row.count
  }

  return {
    leads: { total: r.leads_total, thisMonth, lastMonth, today: r.leads_today, growthPct, timeSeries: Object.entries(byDay).map(([date, count]) => ({ date, count })) },
    users: { total: r.users_total, newThisMonth: r.users_new_this_month },
    subscriptions: { active: r.subs_active, cancelledThisMonth: r.subs_cancelled },
    transactions: { purchasesThisMonth: r.purchases_this_month, totalPurchases: r.purchases_total, unlocksThisMonth: r.unlocks_this_month, totalUnlocks: r.unlocks_total, creditVolumeThisMonth: r.credit_volume },
    assignments: { thisMonth: r.assignments_this_month },
    funnels: { submissionsThisMonth: r.funnel_submissions },
  }
}

export default async function OverviewPage() {
  let data: Awaited<ReturnType<typeof getData>> | null = null
  let error: string | null = null
  try { data = await getData() } catch (err: any) {
    error = `${err?.message ?? 'Unknown error'} (code: ${err?.code ?? 'none'})`
    console.error('Overview DB error:', err)
  }

  const fmt = (n: any) => n != null ? Number(n).toLocaleString() : '—'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Live snapshot of your lead marketplace</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 text-sm">
          ⚠️ Database error: {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Leads" value={fmt(data?.leads.total)} sub={`${fmt(data?.leads.today)} today`} trend={data?.leads.growthPct} color="blue" />
        <StatCard title="Leads This Month" value={fmt(data?.leads.thisMonth)} sub={`vs ${fmt(data?.leads.lastMonth)} last month`} color="blue" />
        <StatCard title="Active Subscriptions" value={fmt(data?.subscriptions.active)} sub={`${fmt(data?.subscriptions.cancelledThisMonth)} cancelled this month`} color="green" />
        <StatCard title="Total Users" value={fmt(data?.users.total)} sub={`${fmt(data?.users.newThisMonth)} new this month`} color="purple" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Purchases This Month" value={fmt(data?.transactions.purchasesThisMonth)} sub={`${fmt(data?.transactions.totalPurchases)} all time`} color="orange" />
        <StatCard title="Unlocks This Month" value={fmt(data?.transactions.unlocksThisMonth)} sub={`${fmt(data?.transactions.totalUnlocks)} all time`} color="orange" />
        <StatCard title="Credit Volume (Month)" value={data?.transactions.creditVolumeThisMonth != null ? `${fmt(data.transactions.creditVolumeThisMonth)} credits` : '—'} color="purple" />
        <StatCard title="Funnel Submissions" value={fmt(data?.funnels.submissionsThisMonth)} sub="this month" color="green" />
      </div>

      <OverviewCharts timeSeries={data?.leads.timeSeries ?? []} />
    </div>
  )
}
