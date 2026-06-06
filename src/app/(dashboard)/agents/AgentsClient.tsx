'use client'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import StatCard from '@/components/StatCard'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

interface Props { data: any }

export default function AgentsClient({ data }: Props) {
  if (!data) return <div className="text-gray-500">No data available</div>

  const active = data.statusBreakdown?.find((s: any) => s.status === 'active')?.count ?? 0
  const cancelled = data.statusBreakdown?.find((s: any) => s.status === 'cancelled')?.count ?? 0
  const referralConversionRate = data.referralStats?.joined
    ? Math.round((data.referralStats.converted / (data.referralStats.joined || 1)) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Subscriptions" value={active} color="green" />
        <StatCard title="Cancelled" value={cancelled} color="red" />
        <StatCard title="Referrals Sent" value={data.referralStats?.pending ?? '—'} sub="pending" color="blue" />
        <StatCard title="Referral Conversions" value={`${referralConversionRate}%`} sub={`${data.referralStats?.converted ?? 0} converted`} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan breakdown */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Active Subscriptions by Plan</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.planBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                {(data.planBreakdown ?? []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Subscription Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.statusBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="status" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} itemStyle={{ color: '#60a5fa' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Near limit */}
      {data.nearLimit?.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-orange-500/30 p-6">
          <h2 className="text-sm font-semibold text-orange-300 mb-4">⚠️ Agents Near Allocation Limit (&ge;80%)</h2>
          <div className="space-y-3">
            {data.nearLimit.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <span className="font-mono text-xs text-gray-500 w-24">{a.user_id?.slice(0, 8)}…</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${a.pct >= 100 ? 'bg-red-500' : 'bg-orange-400'}`}
                    style={{ width: `${Math.min(a.pct, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-24 text-right">{a.used}/{a.allocation} ({a.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscriptions table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Recent Subscriptions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="pb-3 pr-4 font-medium">User</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Usage</th>
                <th className="pb-3 pr-4 font-medium">Cycle End</th>
                <th className="pb-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {(data.subscriptions ?? []).slice(0, 20).map((s: any) => (
                <tr key={s.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="py-3 pr-4 font-mono text-xs text-gray-500">{s.user_id?.slice(0, 8)}…</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      s.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>{s.status}</span>
                  </td>
                  <td className="py-3 pr-4 text-xs">{s.cycle_used}/{s.cycle_allocation}</td>
                  <td className="py-3 pr-4 text-xs text-gray-500">
                    {s.current_cycle_end ? format(parseISO(s.current_cycle_end), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="py-3 text-xs text-gray-500">
                    {s.created_at ? format(parseISO(s.created_at), 'dd MMM yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
