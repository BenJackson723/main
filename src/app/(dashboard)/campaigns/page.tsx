import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import StatCard from '@/components/StatCard'

async function getData() {
  const [messages, sends, sequences, notifQueue] = await Promise.all([
    supabase.from('campaign_messages').select('*').limit(50),
    supabase.from('campaign_message_sends').select('status, send_at, sent_at, send_failed_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('lead_sequence_enrollments').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('notification_queue').select('*').order('created_at', { ascending: false }).limit(30),
  ])
  return {
    messages: messages.data ?? [],
    sends: sends.data ?? [],
    sequences: sequences.data ?? [],
    notifQueue: notifQueue.data ?? [],
  }
}

export default async function CampaignsPage() {
  let data = { messages: [] as any[], sends: [] as any[], sequences: [] as any[], notifQueue: [] as any[] }
  try { data = await getData() } catch {}

  const sendStatusCounts: Record<string, number> = {}
  for (const s of data.sends) {
    sendStatusCounts[s.status ?? 'unknown'] = (sendStatusCounts[s.status ?? 'unknown'] ?? 0) + 1
  }

  const successRate = data.sends.length
    ? Math.round(((sendStatusCounts['sent'] ?? 0) / data.sends.length) * 100)
    : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Campaigns</h1>
        <p className="text-gray-400 text-sm mt-1">Email campaigns, sequences, notifications</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Campaign Messages" value={data.messages.length} color="blue" />
        <StatCard title="Recent Sends" value={data.sends.length} sub="last 100" color="green" />
        <StatCard title="Send Success Rate" value={`${successRate}%`} color={successRate > 80 ? 'green' : 'orange'} />
        <StatCard title="Notification Queue" value={data.notifQueue.length} color="purple" />
      </div>

      {/* Send status breakdown */}
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

      {/* Sequence enrollments */}
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
              {data.sequences.slice(0, 15).map((s: any) => (
                <tr key={s.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="py-3 pr-4 font-mono text-xs text-gray-500">{s.lead_id?.slice(0, 8)}…</td>
                  <td className="py-3 pr-4 text-xs">{s.sequence_id?.slice(0, 8)}…</td>
                  <td className="py-3 text-xs text-gray-500">{s.created_at ? format(parseISO(s.created_at), 'dd MMM yyyy') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notification queue */}
      {data.notifQueue.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Notification Queue</h2>
          <div className="space-y-2">
            {data.notifQueue.slice(0, 10).map((n: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-gray-800 last:border-0">
                <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                <span className="text-gray-300">{n.type ?? n.event_type ?? '—'}</span>
                <span className="text-gray-600 text-xs ml-auto">{n.created_at ? format(parseISO(n.created_at), 'dd MMM HH:mm') : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
