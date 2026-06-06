import LeadsClient from './LeadsClient'

async function getLeads() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/dashboard/leads`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export default async function LeadsPage() {
  const data = await getLeads()
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Lead Analysis</h1>
        <p className="text-gray-400 text-sm mt-1">Pipeline, conversions, funnel performance</p>
      </div>
      <LeadsClient data={data} />
    </div>
  )
}
