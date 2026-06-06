import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const start30d = new Date(Date.now() - 30 * 86400000).toISOString()

    const [recentLeads, leadsByFunnel, dealStages, contactAttempts, auditLog] = await Promise.all([
      supabase
        .from('leads')
        .select('id, created_at, status, suburb, state, property_type, budget_min, budget_max, bedrooms')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('funnel_submissions')
        .select('funnel_id, created_at')
        .gte('created_at', start30d),
      supabase
        .from('deal_stage_history')
        .select('stage, created_at')
        .gte('created_at', start30d),
      supabase
        .from('contact_attempts')
        .select('outcome, created_at')
        .gte('created_at', start30d),
      supabase
        .from('lead_audit_log')
        .select('action, created_at, actor_id')
        .order('created_at', { ascending: false })
        .limit(30),
    ])

    // Group funnel submissions
    const funnelCounts: Record<string, number> = {}
    for (const row of funnel_submissions(leadsByFunnel.data)) {
      funnelCounts[row.funnel_id] = (funnelCounts[row.funnel_id] ?? 0) + 1
    }

    // Group deal stages
    const stageCounts: Record<string, number> = {}
    for (const row of dealStages.data ?? []) {
      stageCounts[row.stage] = (stageCounts[row.stage] ?? 0) + 1
    }

    // Contact attempt outcomes
    const outcomeCounts: Record<string, number> = {}
    for (const row of contactAttempts.data ?? []) {
      const k = row.outcome ?? 'unknown'
      outcomeCounts[k] = (outcomeCounts[k] ?? 0) + 1
    }

    return NextResponse.json({
      recentLeads: recentLeads.data ?? [],
      funnelSubmissions: Object.entries(funnelCounts).map(([id, count]) => ({ funnel_id: id, count })),
      dealStages: Object.entries(stageCounts).map(([stage, count]) => ({ stage, count })),
      contactOutcomes: Object.entries(outcomeCounts).map(([outcome, count]) => ({ outcome, count })),
      auditLog: auditLog.data ?? [],
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch leads data' }, { status: 500 })
  }
}

function funnel_submissions(data: { funnel_id: string; created_at: string }[] | null) {
  return data ?? []
}
