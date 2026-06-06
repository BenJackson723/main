import UsersClient from './UsersClient'

async function getUsers() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/dashboard/users`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export default async function UsersPage() {
  const data = await getUsers()
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
