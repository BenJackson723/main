'use client'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format, parseISO } from 'date-fns'
import StatCard from '@/components/StatCard'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

interface Props { supabase: any; stripe: any }

export default function RevenueClient({ supabase, stripe }: Props) {
  const hasStripe = stripe && !stripe.error
  const hasSupabase = !!supabase

  const creditFormatted = (supabase?.creditTimeSeries ?? []).map((d: any) => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  }))

  const stripeFormatted = (stripe?.revenueTimeSeries ?? []).map((d: any) => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  }))

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {hasStripe ? (
          <>
            <StatCard title="MRR" value={`$${(stripe.mrr ?? 0).toLocaleString('en-AU', { maximumFractionDigits: 0 })}`} color="green" />
            <StatCard title="Revenue This Month" value={`$${(stripe.revenueThisMonth ?? 0).toLocaleString('en-AU', { maximumFractionDigits: 0 })}`} trend={stripe.revenueGrowthPct} color="green" />
            <StatCard title="Stripe Balance" value={`$${(stripe.balance?.available ?? 0).toLocaleString('en-AU', { maximumFractionDigits: 0 })}`} sub={`$${(stripe.balance?.pending ?? 0).toLocaleString()} pending`} color="blue" />
            <StatCard title="Active Subscriptions" value={stripe.activeSubscriptions ?? '—'} sub={`${stripe.newCustomers30d ?? 0} new customers (30d)`} color="purple" />
          </>
        ) : (
          <>
            <StatCard title="Estimated MRR" value={`$${(supabase?.mrr ?? 0).toLocaleString()}`} color="green" />
            <StatCard title="Purchases (90d)" value={supabase?.totalPurchases ?? '—'} color="blue" />
            <StatCard title="Unlocks (90d)" value={supabase?.totalUnlocks ?? '—'} color="purple" />
            <StatCard title="Credit Volume" value="—" color="orange" />
          </>
        )}
      </div>

      {/* Stripe alert if down */}
      {!hasStripe && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-300 text-sm">
          ⚠️ Stripe data unavailable — {stripe?.error ?? 'check API key and allowlist'}
        </div>
      )}

      {/* Dispute alert */}
      {hasStripe && stripe.openDisputeCount > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 text-sm">
          🚨 {stripe.openDisputeCount} open dispute{stripe.openDisputeCount > 1 ? 's' : ''} — review in Stripe dashboard
        </div>
      )}

      {/* Stripe: charge outcomes */}
      {hasStripe && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
            <div className="text-2xl font-bold text-white">{stripe.chargeOutcomes?.succeeded ?? 0}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Succeeded (90d)</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-center">
            <div className="text-2xl font-bold text-white">{stripe.chargeOutcomes?.failed ?? 0}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Failed (90d)</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5 text-center">
            <div className="text-2xl font-bold text-white">{stripe.chargeOutcomes?.refunded ?? 0}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Refunded (90d)</div>
          </div>
        </div>
      )}

      {/* Stripe revenue chart */}
      {hasStripe && stripeFormatted.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Stripe Revenue — Last 90 Days</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stripeFormatted}>
              <defs>
                <linearGradient id="stripeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} interval={8} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Revenue']} />
              <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#stripeGrad)" strokeWidth={2} name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Plan breakdown */}
      {hasStripe && stripe.planBreakdown?.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Active Subscriptions by Plan</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="pb-3 pr-4 font-medium">Plan</th>
                  <th className="pb-3 pr-4 font-medium">Subscribers</th>
                  <th className="pb-3 font-medium">MRR Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stripe.planBreakdown.map((p: any) => (
                  <tr key={p.name} className="text-gray-300 hover:bg-gray-800/50">
                    <td className="py-3 pr-4 font-medium">{p.name}</td>
                    <td className="py-3 pr-4">{p.count}</td>
                    <td className="py-3 text-green-400 font-medium">${p.mrr.toFixed(2)}/mo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Credit activity (Supabase) */}
      {hasSupabase && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Credit Activity — Last 90 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={creditFormatted}>
              <defs>
                <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="debitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} interval={8} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
              <Area type="monotone" dataKey="credits" stroke="#3b82f6" fill="url(#creditGrad)" strokeWidth={2} name="Credits In" />
              <Area type="monotone" dataKey="debits" stroke="#ef4444" fill="url(#debitGrad)" strokeWidth={2} name="Credits Out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Stripe charges */}
      {hasStripe && stripe.recentCharges?.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Recent Charges</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="pb-3 pr-4 font-medium">ID</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Description</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stripe.recentCharges.map((c: any) => (
                  <tr key={c.id} className="text-gray-300 hover:bg-gray-800/50">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-500">{c.id.slice(0, 12)}…</td>
                    <td className="py-3 pr-4 font-medium text-white">${c.amount.toFixed(2)} {c.currency.toUpperCase()}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.refunded ? 'bg-orange-500/20 text-orange-400' :
                        c.status === 'succeeded' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{c.refunded ? 'refunded' : c.status}</span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-400 max-w-[180px] truncate">{c.description ?? '—'}</td>
                    <td className="py-3 text-xs text-gray-500">{format(parseISO(c.created), 'dd MMM yyyy HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent payouts */}
      {hasStripe && stripe.recentPayouts?.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Recent Payouts</h2>
          <div className="space-y-2">
            {stripe.recentPayouts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0 text-sm">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'paid' ? 'bg-green-500' : 'bg-yellow-400'}`} />
                  <span className="text-white font-medium">${p.amount.toFixed(2)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${p.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{p.status}</span>
                </div>
                <span className="text-xs text-gray-500">Arrives {format(parseISO(p.arrival_date), 'dd MMM yyyy')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
