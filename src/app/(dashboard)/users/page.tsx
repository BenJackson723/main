export const dynamic = 'force-dynamic'
import sql from '@/lib/db'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  let data: any = null
  try {
    const start30d = new Date(Date.now() - 30 * 86400000)
    const [recentUsers, signupsByDay, auditEventTypes, notificationStats, onboarding] = await Promise.all([
      sql`SELECT id, email, name AS full_name, created_at FROM users ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT created_at::date as day, COUNT(*)::int as count FROM users WHERE created_at >= ${start30d} GROUP BY day ORDER BY day`,
      sql`SELECT event_type, COUNT(*)::int as count FROM user_audit_events WHERE created_at >= ${start30d} GROUP BY event_type ORDER BY count DESC LIMIT 15`,
      sql`SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE read_at IS NOT NULL)::int as read FROM user_notifications WHERE created_at >= ${start30d}`,
      sql`SELECT * FROM onboarding_surveys ORDER BY created_at DESC LIMIT 50`,
    ])

    const byDay: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      byDay[new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)] = 0
    }
    for (const r of signupsByDay) {
      const d = String(r.day).slice(0, 10)
      if (d in byDay) byDay[d] = r.count
    }

    const total = notificationStats[0].total
    const read = notificationStats[0].read
    data = {
      recentUsers,
      signupsTimeSeries: Object.entries(byDay).map(([date, count]) => ({ date, count })),
      auditEventTypes,
      notifications: { total, read, readRate: total > 0 ? Math.round((read / total) * 100) : 0 },
      onboarding,
    }
  } catch (err: any) {
    data = { error: err?.message }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400 text-sm mt-1">Signups, activity, onboarding, notifications</p>
      </div>
      <UsersClient data={data} />
    </div>
  )
}
