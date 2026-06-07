import { NextResponse } from 'next/server'
import { getStripeData } from '@/lib/stripe-data'

export async function GET() {
  try {
    return NextResponse.json(await getStripeData())
  } catch (err: any) {
    console.error('Stripe error:', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Stripe unavailable' }, { status: 503 })
  }
}
