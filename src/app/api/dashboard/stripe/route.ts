import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    const now = Math.floor(Date.now() / 1000)
    const start30d = now - 30 * 86400
    const start90d = now - 90 * 86400
    const startMonth = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000)
    const startLastMonth = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getTime() / 1000)

    const [
      balance,
      charges90d,
      subscriptions,
      customers,
      invoicesMonth,
      invoicesLastMonth,
      payouts,
      disputes,
    ] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.charges.list({ limit: 100, created: { gte: start90d } }),
      stripe.subscriptions.list({ limit: 100, status: 'active' }),
      stripe.customers.list({ limit: 100, created: { gte: start30d } }),
      stripe.invoices.list({ limit: 100, created: { gte: startMonth }, status: 'paid' }),
      stripe.invoices.list({ limit: 100, created: { gte: startLastMonth, lt: startMonth }, status: 'paid' }),
      stripe.payouts.list({ limit: 10 }),
      stripe.disputes.list({ limit: 20 }),
    ])

    // Balance
    const availableBalance = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100
    const pendingBalance = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100

    // Revenue this month vs last
    const revenueThisMonth = invoicesMonth.data.reduce((sum, inv) => sum + (inv.amount_paid ?? 0), 0) / 100
    const revenueLastMonth = invoicesLastMonth.data.reduce((sum, inv) => sum + (inv.amount_paid ?? 0), 0) / 100
    const revenueGrowthPct = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : null

    // MRR from active subscriptions
    const mrr = subscriptions.data.reduce((sum, sub) => {
      const item = sub.items.data[0]
      if (!item?.price) return sum
      const amount = (item.price.unit_amount ?? 0) * (item.quantity ?? 1)
      return sum + (item.price.recurring?.interval === 'year' ? amount / 12 : amount)
    }, 0) / 100

    // Charges over 90d — daily buckets
    const dailyRevenue: Record<string, number> = {}
    for (let i = 89; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      dailyRevenue[d] = 0
    }
    for (const charge of charges90d.data) {
      if (charge.status !== 'succeeded') continue
      const day = new Date(charge.created * 1000).toISOString().slice(0, 10)
      if (day in dailyRevenue) dailyRevenue[day] += charge.amount / 100
    }
    const revenueTimeSeries = Object.entries(dailyRevenue).map(([date, amount]) => ({ date, amount }))

    // Charge outcomes
    const chargeOutcomes = { succeeded: 0, failed: 0, refunded: 0 }
    for (const c of charges90d.data) {
      if (c.refunded) chargeOutcomes.refunded++
      else if (c.status === 'succeeded') chargeOutcomes.succeeded++
      else chargeOutcomes.failed++
    }

    // Top plan breakdown by subscription
    const planCounts: Record<string, { count: number; mrr: number }> = {}
    for (const sub of subscriptions.data) {
      const item = sub.items.data[0]
      const name = item?.price?.nickname ?? item?.price?.id ?? 'Unknown'
      const amount = ((item?.price?.unit_amount ?? 0) * (item?.quantity ?? 1)) / 100
      if (!planCounts[name]) planCounts[name] = { count: 0, mrr: 0 }
      planCounts[name].count++
      planCounts[name].mrr += item?.price?.recurring?.interval === 'year' ? amount / 12 : amount
    }

    // Recent charges table
    const recentCharges = charges90d.data.slice(0, 30).map(c => ({
      id: c.id,
      amount: c.amount / 100,
      currency: c.currency,
      status: c.status,
      refunded: c.refunded,
      customer: c.customer,
      description: c.description,
      created: new Date(c.created * 1000).toISOString(),
    }))

    // Recent payouts
    const recentPayouts = payouts.data.map(p => ({
      id: p.id,
      amount: p.amount / 100,
      status: p.status,
      arrival_date: new Date(p.arrival_date * 1000).toISOString(),
      created: new Date(p.created * 1000).toISOString(),
    }))

    // Disputes
    const openDisputes = disputes.data.filter(d => d.status !== 'won' && d.status !== 'lost')

    return NextResponse.json({
      balance: { available: availableBalance, pending: pendingBalance },
      mrr,
      revenueThisMonth,
      revenueLastMonth,
      revenueGrowthPct,
      newCustomers30d: customers.data.length,
      activeSubscriptions: subscriptions.data.length,
      chargeOutcomes,
      planBreakdown: Object.entries(planCounts).map(([name, v]) => ({ name, ...v })),
      revenueTimeSeries,
      recentCharges,
      recentPayouts,
      openDisputeCount: openDisputes.length,
      disputes: openDisputes.slice(0, 5).map(d => ({
        id: d.id,
        amount: d.amount / 100,
        reason: d.reason,
        status: d.status,
        created: new Date(d.created * 1000).toISOString(),
      })),
    })
  } catch (err: any) {
    console.error('Stripe error:', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Stripe unavailable' }, { status: 503 })
  }
}
