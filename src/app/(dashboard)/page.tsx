import StatCard from '@/components/StatCard'
import OverviewCharts from './OverviewCharts'

async function getOverview() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/dashboard/overview`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function OverviewPage() {
  const data = await getOverview()

  const fmt = (n: number | null | undefined) => n != null ? n.toLocaleString() : '—'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Live snapshot of your lead marketplace</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={fmt(data?.leads?.total)}
          sub={`${fmt(data?.leads?.today)} today`}
          trend={data?.leads?.growthPct}
          color="blue"
        />
        <StatCard
          title="Leads This Month"
          value={fmt(data?.leads?.thisMonth)}
          sub={`vs ${fmt(data?.leads?.lastMonth)} last month`}
          color="blue"
        />
        <StatCard
          title="Active Subscriptions"
          value={fmt(data?.subscriptions?.active)}
          sub={`${fmt(data?.subscriptions?.cancelledThisMonth)} cancelled this month`}
          color="green"
        />
        <StatCard
          title="Total Users"
          value={fmt(data?.users?.total)}
          sub={`${fmt(data?.users?.newThisMonth)} new this month`}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Purchases This Month"
          value={fmt(data?.transactions?.purchasesThisMonth)}
          sub={`${fmt(data?.transactions?.totalPurchases)} all time`}
          color="orange"
        />
        <StatCard
          title="Unlocks This Month"
          value={fmt(data?.transactions?.unlocksThisMonth)}
          sub={`${fmt(data?.transactions?.totalUnlocks)} all time`}
          color="orange"
        />
        <StatCard
          title="Credit Volume (Month)"
          value={data?.transactions?.creditVolumeThisMonth != null ? fmt(data.transactions.creditVolumeThisMonth) + ' credits' : '—'}
          color="purple"
        />
        <StatCard
          title="Funnel Submissions"
          value={fmt(data?.funnels?.submissionsThisMonth)}
          sub="this month"
          color="green"
        />
      </div>

      {/* Charts */}
      <OverviewCharts timeSeries={data?.leads?.timeSeries ?? []} />

      {data === null && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-300 text-sm">
          ⚠️ Could not connect to Supabase. Check your allowlist settings and API keys in <code>.env.local</code>.
        </div>
      )}
    </div>
  )
}
