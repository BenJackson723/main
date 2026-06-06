import RevenueClient from './RevenueClient'

async function getRevenue() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/dashboard/revenue`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export default async function RevenuePage() {
  const data = await getRevenue()
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue</h1>
        <p className="text-gray-400 text-sm mt-1">Credits, purchases, unlocks, MRR</p>
      </div>
      <RevenueClient data={data} />
    </div>
  )
}
