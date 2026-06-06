'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'

interface Props {
  timeSeries: { date: string; count: number }[]
}

export default function OverviewCharts({ timeSeries }: Props) {
  const formatted = timeSeries.map(d => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  }))

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Leads — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#60a5fa' }}
            />
            <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#leadGrad)" strokeWidth={2} name="Leads" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
