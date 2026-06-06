import sql from '@/lib/db'
import { format } from 'date-fns'
import StatCard from '@/components/StatCard'

export default async function MarketplacePage() {
  let listings: any[] = [], assignments: any[] = [], events: any[] = []

  try {
    ;[listings, assignments, events] = await Promise.all([
      sql`SELECT * FROM marketplace_listings ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT * FROM lead_assignments ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT event_type, created_at, metadata FROM assignment_events ORDER BY created_at DESC LIMIT 50`,
    ])
  } catch (err: any) {
    console.error('Marketplace error:', err?.message)
  }

  const statusCounts: Record<string, number> = {}
  for (const l of listings) {
    const k = l.status ?? 'unknown'
    statusCounts[k] = (statusCounts[k] ?? 0) + 1
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Marketplace</h1>
        <p className="text-gray-400 text-sm mt-1">Listings, assignments, activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Listings" value={listings.length} color="blue" />
        {Object.entries(statusCounts).map(([status, count]) => (
          <StatCard key={status} title={`${status} Listings`} value={count} color="green" />
        ))}
        <StatCard title="Recent Assignments" value={assignments.length} sub="last 50" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Recent Listings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {listings.slice(0, 15).map((l: any) => (
                  <tr key={l.id} className="text-gray-300 hover:bg-gray-800/50">
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">{l.status ?? '—'}</span>
                    </td>
                    <td className="py-3 text-xs text-gray-500">
                      {l.created_at ? format(new Date(l.created_at), 'dd MMM yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Assignment Events</h2>
          <div className="space-y-2">
            {events.slice(0, 15).map((e: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b border-gray-800 last:border-0">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-gray-300">{e.event_type ?? '—'}</span>
                <span className="text-gray-600 text-xs ml-auto">
                  {e.created_at ? format(new Date(e.created_at), 'dd MMM HH:mm') : '—'}
                </span>
              </div>
            ))}
            {!events.length && <p className="text-gray-600 text-sm">No events</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
