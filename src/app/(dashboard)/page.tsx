import sql from '@/lib/db'
import StatCard from '@/components/StatCard'
import OverviewCharts from './OverviewCharts'

async function getData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start30d = new Date(Date.now() - 30 * 86400000)

  const [
    totalLeads, leadsThisMonth, leadsLastMonth, leadsToday,
    totalUsers, newUsersThisMonth,
    activeSubscriptions, cancelledThisMonth,
    purchasesThisMonth, totalPurchases,
    unlocksThisMonth, totalUnlocks,
    creditVolume, assignmentsThisMonth,
    funnelSubmissions, leadsLast30d,
  ] = await Promise.all([
    sql`SELECT COUNT(*)::int FROM leads`,
    sql`SELECT COUNT(*)::int FROM leads WHERE created_at >= ${startOfMonth}`,
    sql`SELECT COUNT(*)::int FROM leads WHERE created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth}`,
    sql`SELECT COUNT(*)::int FROM leads WHERE created_at >= ${startOfToday}`,
    sql`SELECT COUNT(*)::int FROM users`,
    sql`SELECT COUNT(*)::int FROM users WHERE created_at >= ${startOfMonth}`,
    sql`SELECT COUNT(*)::int FROM agent_subscriptions WHERE status = 'active'`,
    sql`SELECT COUNT(*)::int FROM agent_subscriptions WHERE cancelled_at >= ${startOfMonth}`,
    sql`SELECT COUNT(*)::int FROM lead_purchases WHERE created_at >= ${startOfMonth}`,
    sql`SELECT COUNT(*)::int FROM lead_purchases`,
    sql`SELECT COUNT(*)::int FROM lead_unlocks WHERE created_at >= ${startOfMonth}`,
    sql`SELECT COUNT(*)::int FROM lead_unlocks`,
    sql`SELECT COALESCE(SUM(ABS(amount)), 0)::int as total FROM credit_transactions WHERE created_at >= ${startOfMonth}`,
    sql`SELECT COUNT(*)::int FROM lead_assignments WHERE created_at >= ${startOfMonth}`,
    sql`SELECT COUNT(*)::int FROM funnel_submissions WHERE created_at >= ${startOfMonth}`,
    sql`SELECT created_at::date as day, COUNT(*)::int as count FROM leads WHERE created_at >= ${start30d} GROUP BY day ORDER BY day`,
  ])

  const thisMonth = leadsThisMonth[0].count
  const lastMonth = leadsLastMonth[0].count
  const growthPct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null

  const byDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    byDay[new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)] = 0
  }
  for (const r of leadsLast30d) {
    const d = String(r.day).slice(0, 10)
    if (d in byDay) byDay[d] = r.count
  }

  return {
    leads: { total: totalLeads[0].count, thisMonth, lastMonth, today: leadsToday[0].count, growthPct, timeSeries: Object.entries(byDay).map(([date, count]) => ({ date, count })) },
    users: { total: totalUsers[0].count, newThisMonth: newUsersThisMonth[0].count },
    subscriptions: { active: activeSubscriptions[0].count, cancelledThisMonth: cancelledThisMonth[0].count },
    transactions: { purchasesThisMonth: purchasesThisMonth[0].count, totalPurchases: totalPurchases[0].count, unlocksThisMonth: unlocksThisMonth[0].count, totalUnlocks: totalUnlocks[0].count, creditVolumeThisMonth: creditVolume[0].total },
    assignments: { thisMonth: assignmentsThisMonth[0].count },
    funnels: { submissionsThisMonth: funnelSubmissions[0].count },
  }
}

export default async function OverviewPage() {
  let data: Awaited<ReturnType<typeof getData>> | null = null
  let error: string | null = null
  try { data = await getData() } catch (err: any) { error = err?.message }

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
