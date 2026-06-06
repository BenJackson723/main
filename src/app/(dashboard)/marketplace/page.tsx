import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import StatCard from '@/components/StatCard'

async function getData() {
  const [listings, assignments, assignmentEvents] = await Promise.all([
    supabase.from('marketplace_listings').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('lead_assignments').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('assignment_events').select('event_type, created_at, metadata').order('created_at', { ascending: false }).limit(50),
  ])
  return { listings: listings.data ?? [], assignments: assignments.data ?? [], events: assignmentEvents.data ?? [] }
}

export default async function MarketplacePage() {
  let data = { listings: [] as any[], assignments: [] as any[], events: [] as any[] }
  try { data = await getData() } catch {}

  const statusCounts: Record<string, number> = {}
  for (const l of data.listings) {
    statusCounts[l.status ?? 'unknown'] = (statusCounts[l.status ?? 'unknown'] ?? 0) + 1
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Marketplace</h1>
        <p className="text-gray-400 text-sm mt-1">Listings, assignments, activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Listings" value={data.listings.length} color="blue" />
        {Object.entries(statusCounts).map(([status, count]) => (
          <StatCard key={status} title={`${status} Listings`} value={count} color="green" />
        ))}
        <StatCard title="Recent Assignments" value={data.assignments.length} sub="last 50" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Recent Listings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.listings.slice(0, 15).map((l: any) => (
                  <tr key={l.id} className="text-gray-300 hover:bg-gray-800/50">
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">{l.status ?? '—'}</span>
                    </td>
                    <td className="py-3 text-xs text-gray-500">{l.created_at ? format(parseISO(l.created_at), 'dd MMM yyyy') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Assignment Events</h2>
          <div className="space-y-2">
            {data.events.slice(0, 15).map((e: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b border-gray-800 last:border-0">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-gray-300">{e.event_type ?? '—'}</span>
                <span className="text-gray-600 text-xs ml-auto">{e.created_at ? format(parseISO(e.created_at), 'dd MMM HH:mm') : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
