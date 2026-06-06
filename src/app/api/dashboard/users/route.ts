import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  try {
    const start30d = new Date(Date.now() - 30 * 86400000)

    const [recentUsers, signupsByDay, auditEventTypes, notificationStats, onboarding] = await Promise.all([
      sql`
        SELECT id, email, full_name, phone, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 100
      `,
      sql`
        SELECT created_at::date as day, COUNT(*) as count
        FROM users
        WHERE created_at >= ${start30d}
        GROUP BY day
        ORDER BY day
      `,
      sql`
        SELECT event_type, COUNT(*) as count
        FROM user_audit_events
        WHERE created_at >= ${start30d}
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 15
      `,
      sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE read_at IS NOT NULL) as read
        FROM user_notifications
        WHERE created_at >= ${start30d}
      `,
      sql`
        SELECT *
        FROM onboarding_surveys
        ORDER BY created_at DESC
        LIMIT 50
      `,
    ])

    // Zero-fill signups
    const byDay: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      byDay[new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)] = 0
    }
    for (const row of signupsByDay) {
      const d = String(row.day).slice(0, 10)
      if (d in byDay) byDay[d] = Number(row.count)
    }

    const total = Number(notificationStats[0].total)
    const read = Number(notificationStats[0].read)

    return NextResponse.json({
      recentUsers,
      signupsTimeSeries: Object.entries(byDay).map(([date, count]) => ({ date, count })),
      auditEventTypes,
      notifications: { total, read, readRate: total ? Math.round((read / total) * 100) : 0 },
      onboarding,
    })
  } catch (err: any) {
    console.error('Users error:', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
