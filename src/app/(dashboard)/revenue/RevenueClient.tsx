'use client'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format, parseISO } from 'date-fns'
import StatCard from '@/components/StatCard'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

interface Props { data: any }

export default function RevenueClient({ data }: Props) {
  if (!data) return <div className="text-gray-500">No data available</div>

  const formatted = (data.creditTimeSeries ?? []).map((d: any) => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Estimated MRR" value={`$${(data.mrr ?? 0).toLocaleString()}`} color="green" />
        <StatCard title="Total Purchases (90d)" value={data.totalPurchases ?? '—'} color="blue" />
        <StatCard title="Total Unlocks (90d)" value={data.totalUnlocks ?? '—'} color="purple" />
      </div>

      {/* Credit volume over time */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Credit Activity — Last 90 Days</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="debitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} interval={6} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
            <Area type="monotone" dataKey="credits" stroke="#10b981" fill="url(#creditGrad)" strokeWidth={2} name="Credits In" />
            <Area type="monotone" dataKey="debits" stroke="#ef4444" fill="url(#debitGrad)" strokeWidth={2} name="Credits Out" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction types */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Transaction Types (90d)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.transactionTypes} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis dataKey="type" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} itemStyle={{ color: '#60a5fa' }} />
            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent transactions */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="pb-3 pr-4 font-medium">User</th>
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 font-medium">Amount</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {(data.recentTransactions ?? []).slice(0, 30).map((tx: any, i: number) => (
                <tr key={i} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="py-3 pr-4 font-mono text-xs text-gray-500">{tx.user_id?.slice(0, 8)}…</td>
                  <td className="py-3 pr-4 text-xs">{tx.type ?? '—'}</td>
                  <td className={`py-3 pr-4 text-xs font-medium ${(tx.amount ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(tx.amount ?? 0) >= 0 ? '+' : ''}{tx.amount}
                  </td>
                  <td className="py-3 text-xs text-gray-500">
                    {tx.created_at ? format(parseISO(tx.created_at), 'dd MMM yyyy HH:mm') : '—'}
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
