import { cookies } from 'next/headers'

const SESSION_COOKIE = 'dashboard_session'
const PASSWORD = process.env.DASHBOARD_PASSWORD ?? 'admin2024'

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value === 'authenticated'
}

export function checkPassword(password: string): boolean {
  return password === PASSWORD
}

export { SESSION_COOKIE }
