'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

interface Props { data: any }

export default function LeadsClient({ data }: Props) {
  if (!data) return <div className="text-gray-500">No data available</div>
  if (data.error) return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 text-sm">
      ⚠️ Database error: {data.error}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Deal Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Deal Stages (30d)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.dealStages} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="stage" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} itemStyle={{ color: '#60a5fa' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Contact Outcomes (30d)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.contactOutcomes} dataKey="count" nameKey="outcome" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {(data.contactOutcomes ?? []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Leads Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Recent Leads</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="pb-3 pr-4 font-medium">ID</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Location</th>
                <th className="pb-3 pr-4 font-medium">Property Type</th>
                <th className="pb-3 pr-4 font-medium">Budget</th>
                <th className="pb-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {(data.recentLeads ?? []).slice(0, 20).map((lead: any) => (
                <tr key={lead.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="py-3 pr-4 font-mono text-xs text-gray-500">{lead.id?.slice(0, 8)}…</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      lead.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      lead.status === 'sold' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>{lead.status ?? '—'}</span>
                  </td>
                  <td className="py-3 pr-4">{[lead.suburb, lead.state].filter(Boolean).join(', ') || '—'}</td>
                  <td className="py-3 pr-4">{lead.property_type ?? '—'}</td>
                  <td className="py-3 pr-4">
                    {lead.budget_min || lead.budget_max
                      ? `$${(lead.budget_min / 1000).toFixed(0)}k – $${(lead.budget_max / 1000).toFixed(0)}k`
                      : '—'}
                  </td>
                  <td className="py-3 text-gray-500 text-xs">
                    {lead.created_at ? format(parseISO(lead.created_at), 'dd MMM yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Lead Audit Log</h2>
        <div className="space-y-2">
          {(data.auditLog ?? []).slice(0, 15).map((entry: any, i: number) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-400 py-1.5 border-b border-gray-800 last:border-0">
              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="font-medium text-gray-300">{entry.action}</span>
              <span className="text-gray-600 text-xs ml-auto">
                {entry.created_at ? format(parseISO(entry.created_at), 'dd MMM HH:mm') : '—'}
              </span>
            </div>
          ))}
          {!data.auditLog?.length && <p className="text-gray-600 text-sm">No audit entries</p>}
        </div>
      </div>
    </div>
  )
}
