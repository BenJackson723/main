import { clsx } from 'clsx'

interface Props {
  title: string
  value: string | number
  sub?: string
  trend?: number | null
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

export default function StatCard({ title, value, sub, trend, color = 'blue' }: Props) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20',
    green: 'bg-green-500/10 border-green-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20',
    orange: 'bg-orange-500/10 border-orange-500/20',
    red: 'bg-red-500/10 border-red-500/20',
  }

  return (
    <div className={clsx('rounded-xl border p-5', colors[color])}>
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {(sub || trend !== undefined) && (
        <div className="mt-1 flex items-center gap-2">
          {sub && <span className="text-xs text-gray-500">{sub}</span>}
          {trend !== null && trend !== undefined && (
            <span className={clsx('text-xs font-medium', trend >= 0 ? 'text-green-400' : 'text-red-400')}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}
