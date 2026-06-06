import RevenueClient from './RevenueClient'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

async function getSupabaseRevenue() {
  try {
    const res = await fetch(`${BASE}/api/dashboard/revenue`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

async function getStripeRevenue() {
  try {
    const res = await fetch(`${BASE}/api/dashboard/stripe`, { cache: 'no-store' })
    return res.json()
  } catch { return { error: 'unavailable' } }
}

export default async function RevenuePage() {
  const [supabase, stripe] = await Promise.all([getSupabaseRevenue(), getStripeRevenue()])
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue</h1>
        <p className="text-gray-400 text-sm mt-1">Stripe payments, MRR, credits, payouts, disputes</p>
      </div>
      <RevenueClient supabase={supabase} stripe={stripe} />
    </div>
  )
}
