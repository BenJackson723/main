import AgentsClient from './AgentsClient'

async function getAgents() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/dashboard/agents`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export default async function AgentsPage() {
  const data = await getAgents()
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Agent Management</h1>
        <p className="text-gray-400 text-sm mt-1">Subscriptions, usage, referrals, bonuses</p>
      </div>
      <AgentsClient data={data} />
    </div>
  )
}
