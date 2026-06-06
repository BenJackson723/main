export const dynamic = 'force-dynamic'
import sql from '@/lib/db'
import { format } from 'date-fns'
import StatCard from '@/components/StatCard'

export default async function CampaignsPage() {
  let messages: any[] = [], sends: any[] = [], sequences: any[] = [], notifQueue: any[] = []

  try {
    ;[messages, sends, sequences, notifQueue] = await Promise.all([
      sql`SELECT * FROM campaign_messages LIMIT 50`,
      sql`SELECT status, send_at, sent_at, send_failed_at, created_at FROM campaign_message_sends ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT * FROM lead_sequence_enrollments ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT * FROM notification_queue ORDER BY created_at DESC LIMIT 30`,
    ])
  } catch (err: any) {
    console.error('Campaigns error:', err?.message)
  }

  const sendStatusCounts: Record<string, number> = {}
  for (const s of sends) {
    const k = s.status ?? 'unknown'
    sendStatusCounts[k] = (sendStatusCounts[k] ?? 0) + 1
  }
  const successRate = sends.length
    ? Math.round(((sendStatusCounts['sent'] ?? 0) / sends.length) * 100)
    : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Campaigns</h1>
        <p className="text-gray-400 text-sm mt-1">Email campaigns, sequences, notifications</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Campaign Messages" value={messages.length} color="blue" />
        <StatCard title="Recent Sends" value={sends.length} sub="last 100" color="green" />
        <StatCard title="Send Success Rate" value={`${successRate}%`} color={successRate > 80 ? 'green' : 'orange'} />
        <StatCard title="Notification Queue" value={notifQueue.length} color="purple" />
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Send Status Breakdown</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(sendStatusCounts).map(([status, count]) => (
            <div key={status} className="bg-gray-800 rounded-lg px-4 py-3 text-center min-w-[100px]">
              <div className="text-xl font-bold text-white">{count}</div>
              <div className="text-xs text-gray-400 mt-1">{status}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Lead Sequence Enrollments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="pb-3 pr-4 font-medium">Lead ID</th>
                <th className="pb-3 pr-4 font-medium">Sequence</th>
                <th className="pb-3 font-medium">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sequences.slice(0, 15).map((s: any) => (
                <tr key={s.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="py-3 pr-4 font-mono text-xs text-gray-500">{String(s.lead_id).slice(0, 8)}…</td>
                  <td className="py-3 pr-4 text-xs">{String(s.sequence_id ?? s.email_sequence_definition_id ?? '—').slice(0, 8)}…</td>
                  <td className="py-3 text-xs text-gray-500">
                    {s.created_at ? format(new Date(s.created_at), 'dd MMM yyyy') : '—'}
                  </td>
                </tr>
              ))}
              {!sequences.length && <tr><td colSpan={3} className="py-4 text-gray-600 text-sm">No enrollments</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {notifQueue.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Notification Queue</h2>
          <div className="space-y-2">
            {notifQueue.slice(0, 10).map((n: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-gray-800 last:border-0">
                <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                <span className="text-gray-300">{n.type ?? n.event_type ?? '—'}</span>
                <span className="text-gray-600 text-xs ml-auto">
                  {n.created_at ? format(new Date(n.created_at), 'dd MMM HH:mm') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
