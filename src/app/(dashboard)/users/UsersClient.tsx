'use client'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import StatCard from '@/components/StatCard'

interface Props { data: any }

export default function UsersClient({ data }: Props) {
  if (!data) return <div className="text-gray-500">No data available</div>
  if (data.error) return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 text-sm">
      ⚠️ Database error: {data.error}
    </div>
  )

  const signupsFormatted = (data.signupsTimeSeries ?? []).map((d: any) => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Users" value={data.recentUsers?.length ?? '—'} sub="shown: last 100" color="blue" />
        <StatCard title="Notification Read Rate" value={`${data.notifications?.readRate ?? 0}%`} sub={`${data.notifications?.read}/${data.notifications?.total} (30d)`} color="green" />
        <StatCard title="Onboarding Completed" value={data.onboarding?.length ?? '—'} color="purple" />
      </div>

      {/* Signups time series */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">New Signups — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={signupsFormatted}>
            <defs>
              <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} itemStyle={{ color: '#a78bfa' }} />
            <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="url(#signupGrad)" strokeWidth={2} name="Signups" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Audit event types */}
      {data.auditEventTypes?.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">User Activity Types (30d)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.auditEventTypes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="type" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} width={140} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} itemStyle={{ color: '#60a5fa' }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Users table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Recent Signups</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {(data.recentUsers ?? []).slice(0, 25).map((u: any) => (
                <tr key={u.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="py-3 pr-4">{u.full_name ?? '—'}</td>
                  <td className="py-3 pr-4 text-gray-400">{u.email ?? '—'}</td>
                  <td className="py-3 text-xs text-gray-500">
                    {u.created_at ? format(parseISO(u.created_at), 'dd MMM yyyy') : '—'}
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
