import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const start30d = new Date(Date.now() - 30 * 86400000).toISOString()

    const [users, auditEvents, notifications, onboarding] = await Promise.all([
      supabase
        .from('users')
        .select('id, email, created_at, full_name, phone, avatar_url')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('user_audit_events')
        .select('event_type, created_at, user_id, metadata')
        .gte('created_at', start30d)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('user_notifications')
        .select('type, read_at, created_at')
        .gte('created_at', start30d),
      supabase
        .from('onboarding_surveys')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    // Signups per day last 30d
    const signupsByDay: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      signupsByDay[d] = 0
    }
    for (const u of users.data ?? []) {
      const day = (u.created_at as string).slice(0, 10)
      if (day in signupsByDay) signupsByDay[day]++
    }

    // Audit event types
    const eventCounts: Record<string, number> = {}
    for (const e of auditEvents.data ?? []) {
      const k = e.event_type ?? 'unknown'
      eventCounts[k] = (eventCounts[k] ?? 0) + 1
    }

    // Notification read rate
    const totalNotifs = notifications.data?.length ?? 0
    const readNotifs = (notifications.data ?? []).filter(n => n.read_at).length

    return NextResponse.json({
      recentUsers: users.data ?? [],
      signupsTimeSeries: Object.entries(signupsByDay).map(([date, count]) => ({ date, count })),
      auditEvents: auditEvents.data ?? [],
      auditEventTypes: Object.entries(eventCounts).map(([type, count]) => ({ type, count })),
      notifications: {
        total: totalNotifs,
        read: readNotifs,
        readRate: totalNotifs ? Math.round((readNotifs / totalNotifs) * 100) : 0,
      },
      onboarding: onboarding.data ?? [],
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch users data' }, { status: 500 })
  }
}
